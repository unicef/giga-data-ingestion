import json
import os
from typing import Annotated

import country_converter as coco
import magic
import orjson
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    Security,
    status,
)
from fastapi_azure_auth.user import User
from loguru import logger
from pydantic import Field
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import StreamingResponse

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.data_quality_checks import (
    get_data_quality_summary,
    get_first_n_error_rows_for_data_quality_check,
)
from data_ingestion.internal.roles import get_user_roles
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import (
    FileUpload,
    User as DatabaseUser,
)
from data_ingestion.models.file_upload import DQStatusEnum
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.core import PagedResponseSchema
from data_ingestion.schemas.upload import (
    FileUpload as FileUploadSchema,
    FileUploadRequest,
    UnstructuredFileUploadRequest,
)

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(azure_scheme)],
)


@router.get("/basic_check/{dataset}")
async def list_basic_checks(
    dataset: str = "geolocation",
    source: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    path = ""

    is_completed_query = (
        select(FileUpload)
        .where(FileUpload.is_processed_in_staging == True)  # noqa: E712
        .where(FileUpload.dataset == dataset)
        .where(FileUpload.dq_status == DQStatusEnum.COMPLETED)
        .where(FileUpload.dq_report_path != None)  # noqa: E711
        .where(FileUpload.dq_full_path != None)  # noqa: E711
        .order_by(FileUpload.created.desc())
    )

    if dataset == "geolocation":
        result = await db.scalars(is_completed_query)
        file_upload = result.first()

        if file_upload is not None:
            path = file_upload.dq_report_path
        else:
            path = (
                "data-quality-results/school-geolocation/"
                "sample-data-check/geolocation.json"
            )

    if dataset == "coverage":
        if source not in ["fb", "itu"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Schema does not exist"
            )

        is_completed_coverage_query = is_completed_query.where(
            FileUpload.source == source
        )

        result = await db.scalars(is_completed_coverage_query)
        file_upload = result.first()

        if file_upload is not None:
            path = file_upload.dq_report_path
        else:
            path = (
                "data-quality-results/school-coverage/"
                f"sample-data-check/{source}.json"
            )

    blob = storage_client.get_blob_client(path)
    if not blob.exists():
        logger.error("DQ report summary still does not exist")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found",
        )

    blob_data = blob.download_blob().readall()
    dq_report_summary = blob_data.decode("utf-8")
    dq_report_summary_dict: dict = json.loads(dq_report_summary)

    return dq_report_summary_dict


@router.get("", response_model=PagedResponseSchema[FileUploadSchema])
async def list_uploads(
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    db: AsyncSession = Depends(get_db),
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Field(ge=1, le=50)] = 10,
    id_search: Annotated[
        str,
        Query(min_length=1, max_length=24, pattern=r"^\w+$"),
    ] = None,
):
    query = select(FileUpload)
    if not is_privileged:
        query = query.where(
            FileUpload.uploader_email == user.claims.get("emails", ["NONE"])[0]
        )

    if id_search:
        query = query.where(func.starts_with(FileUpload.id, id_search))

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    items = await db.scalars(
        query.order_by(FileUpload.created.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )

    return {
        "data": items,
        "page": page,
        "page_size": page_size,
        "total_count": total,
    }


@router.get("/{upload_id}", response_model=FileUploadSchema)
async def get_upload(
    upload_id: str,
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    db: AsyncSession = Depends(get_db),
):
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access details for this file.",
        )

    return file_upload


@router.post("", response_model=FileUploadSchema)
async def upload_file(
    response: Response,
    dataset: str,
    form: FileUploadRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    file = form.file

    if not is_privileged:
        country_dataset = f"{form.country}-School {dataset.capitalize()}"
        roles = await get_user_roles(user, db)
        if country_dataset not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions on this dataset",
            )

    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )

    file_content = await file.read(4096)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    if file_type not in constants.VALID_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_extension not in constants.VALID_UPLOAD_TYPES[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match file type.",
        )

    country_code = coco.convert(form.country, to="ISO3")
    email = user.claims.get("emails")[0]
    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    file_upload = FileUpload(
        uploader_id=database_user.id,
        uploader_email=database_user.email,
        country=country_code,
        dataset=dataset,
        source=form.source,
        original_filename=file.filename,
        column_to_schema_mapping=orjson.loads(form.column_to_schema_mapping),
        column_license=orjson.loads(form.column_license),
    )
    db.add(file_upload)
    await db.commit()

    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            **{str(k): str(v) for k, v in orjson.loads(form.metadata).items()},
            "country": form.country,
            "uploader_email": email,
        }

        if form.source is not None:
            metadata["source"] = form.source

        await file.seek(0)
        client.upload_blob(
            await file.read(),
            metadata=metadata,
            content_settings=ContentSettings(content_type=file_type),
        )
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == file_upload.id))
        await db.commit()
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == file_upload.id))
        await db.commit()
        raise err

    return file_upload


@router.post("/unstructured", status_code=status.HTTP_201_CREATED)
async def upload_unstructured(  # noqa: C901
    response: Response,
    user: User = Depends(azure_scheme),
    form: UnstructuredFileUploadRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    file = form.file

    if not is_privileged:
        roles = await get_user_roles(user, db)
        if not any(role.rsplit("-")[0] == form.country for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions on this dataset",
            )

    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )

    file_content = await file.read(2048)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    if file_type not in constants.VALID_UNSTRUCTURED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_extension not in constants.VALID_UNSTRUCTURED_UPLOAD_TYPES[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match file type.",
        )

    country_code = coco.convert(form.country, to="ISO3")
    if country_code == "not found":
        country_code = "N/A"

    email = user.claims.get("emails")[0]
    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    file_upload = FileUpload(
        uploader_id=database_user.id,
        uploader_email=database_user.email,
        country=country_code,
        dataset="unstructured",
        original_filename=file.filename,
        column_to_schema_mapping={},
        column_license={},
        dq_status=DQStatusEnum.SKIPPED,
    )
    db.add(file_upload)
    await db.commit()

    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            **{str(k): str(v) for k, v in orjson.loads(form.metadata).items()},
            "country": form.country,
            "uploader_email": email,
        }

        if form.source is not None:
            metadata["source"] = form.source

        await file.seek(0)
        client.upload_blob(
            await file.read(),
            metadata=metadata,
            content_settings=ContentSettings(content_type=file_type),
        )
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        raise err


@router.get(
    "/data_quality_check/{upload_id}",
)
async def get_data_quality_check(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access details for this file.",
        )

    if file_upload.dq_status != DQStatusEnum.COMPLETED:
        return {
            "name": None,
            "creation_time": None,
            "dq_summary": None,
            "dq_failed_rows_first_five_rows": None,
            "status": file_upload.dq_status,
        }
    blob_properties, results = get_first_n_error_rows_for_data_quality_check(
        file_upload.dq_full_path
    )
    dq_report_summary_dict = get_data_quality_summary(file_upload.dq_report_path)

    return {
        "name": blob_properties.name,
        "creation_time": blob_properties.creation_time.isoformat(),
        "dq_summary": dq_report_summary_dict,
        "dq_failed_rows_first_five_rows": results,
        "status": file_upload.dq_status,
    }


@router.get(
    "/data_quality_check/{upload_id}/download",
)
async def download_data_quality_check(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if not is_privileged:
        if file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access details for this file.",
            )

    upload_path_parts = file_upload.dq_full_path.split("/")
    upload_filename = upload_path_parts[-1]
    blob = storage_client.get_blob_client(file_upload.dq_full_path)
    stream = blob.download_blob()
    headers = {"Content-Disposition": f"attachment; filename={upload_filename}"}

    return StreamingResponse(
        stream.chunks(),
        media_type="application/octet-stream",
        headers=headers,
    )
