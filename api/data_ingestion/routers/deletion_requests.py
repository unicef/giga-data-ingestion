import json
import os
from datetime import datetime
from typing import Annotated

import country_converter as coco
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Security,
    UploadFile,
)
from fastapi_azure_auth.user import User
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db
from data_ingestion.db.trino import get_db as get_trino_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import (
    DeletionRequest,
    User as DatabaseUser,
)
from data_ingestion.models.base import cuid_generator
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.core import PagedResponseSchema
from data_ingestion.schemas.deletion_requests import (
    DeleteRows,
    DeleteRowsSchema,
    PreviewDeleteRowsRequest,
    PreviewDeleteRowsResponse,
)

router = APIRouter(
    prefix="/api/delete",
    tags=["deletion-requests"],
    dependencies=[Security(IsPrivileged())],
)


def _in_clause(ids: list[str]) -> str:
    """Build a safe SQL IN clause from a list of string IDs."""
    escaped = ", ".join(f"'{i.replace(chr(39), '')}'" for i in ids)
    return f"({escaped})"


@router.post("/preview", response_model=PreviewDeleteRowsResponse)
async def preview_delete_rows(
    body: PreviewDeleteRowsRequest,
    trino_db: Session = Depends(get_trino_db),
):
    country_iso3 = coco.convert(body.country, to="ISO3")
    silver = f"delta_lake.school_geolocation_silver.{country_iso3.lower()}"

    try:
        if body.delete_type == "all":
            result = trino_db.execute(
                text(f"SELECT COUNT(*) FROM {silver}")  # nosec B608
            )
            count = result.scalar() or 0
            return {"school_count": count}

        if len(body.ids) > constants.DELETE_PREVIEW_ID_CAP:
            return {"school_count": None, "check_skipped": True}

        id_col = body.id_type  # Literal — safe in SQL
        result = trino_db.execute(
            text(
                f"SELECT COUNT(*) FROM {silver}"  # nosec B608
                f" WHERE {id_col} IN {_in_clause(body.ids)}"
            )
        )
        count = result.scalar() or 0
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err

    return {"school_count": count}


@router.get("", response_model=PagedResponseSchema[DeleteRows])
async def list_deletion_requests(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
    db: AsyncSession = Depends(get_db),
):
    query = select(DeletionRequest)
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    items = await db.scalars(
        query.order_by(DeletionRequest.requested_date.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )

    return {
        "data": list(items),
        "page": page,
        "page_size": page_size,
        "total_count": total,
    }


@router.post("", response_model=DeleteRowsSchema)
async def delete_rows(
    country: str = Form(...),
    delete_type: str = Form("specific"),
    ids: str = Form("[]"),
    id_type: str = Form("school_id_giga"),
    original_filename: str = Form(""),
    school_count_override: int | None = Form(None),
    file: Annotated[UploadFile | None, File()] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
):
    parsed_ids = json.loads(ids)
    country_iso3 = coco.convert(country, to="ISO3")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    record_id = cuid_generator()

    email = user.claims.get("emails")[0]

    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    json_filename = f"{record_id}_{country_iso3}_delete_{timestamp}.json"
    delete_location = (
        f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}"
        f"/delete-row-ids/{country_iso3}/{json_filename}"
    )

    is_delete_all = delete_type == "all"
    ids_to_store = ["__all__"] if is_delete_all else parsed_ids
    school_count = school_count_override if is_delete_all else len(parsed_ids)
    delete_payload = {
        "id_type": None if is_delete_all else id_type,
        "ids": ids_to_store,
    }

    delete_client = storage_client.get_blob_client(delete_location)

    try:
        delete_client.upload_blob(
            json.dumps(delete_payload),
            overwrite=True,
            metadata={"requester_email": database_user.email},
            content_settings=ContentSettings(content_type="application/json"),
        )
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err

    raw_file_path = None
    if file:
        ext = os.path.splitext(file.filename or original_filename)[1] or ".csv"
        raw_filename = f"{record_id}_{country_iso3}_delete_{timestamp}{ext}"
        raw_file_path = f"raw/uploads/deletions/{country_iso3}/{raw_filename}"
        raw_client = storage_client.get_blob_client(raw_file_path)
        file_bytes = await file.read()
        try:
            raw_client.upload_blob(
                file_bytes,
                overwrite=True,
                content_settings=ContentSettings(
                    content_type=file.content_type or "text/csv"
                ),
            )
        except HttpResponseError as err:
            raise HTTPException(
                detail=err.message, status_code=err.response.status_code
            ) from err

    db.add(
        DeletionRequest(
            id=record_id,
            requested_by_email=database_user.email,
            requested_by_id=database_user.id,
            country=country_iso3,
            original_filename=original_filename or None,
            id_type=id_type if not is_delete_all else None,
            school_count=school_count,
            file_path=delete_location,
            raw_file_path=raw_file_path,
            is_delete_all=is_delete_all,
        )
    )
    await db.commit()

    return {"filename": json_filename}
