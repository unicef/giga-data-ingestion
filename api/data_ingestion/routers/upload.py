import os
from typing import Annotated

import country_converter as coco
import magic
from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Query,
    Response,
    Security,
    UploadFile,
    status,
)
from fastapi_azure_auth.user import User
from pydantic import AwareDatetime, Field
from sqlalchemy import delete, desc, func, select
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
from data_ingestion.internal.storage import storage_client
from data_ingestion.internal.users import UsersApi
from data_ingestion.models import FileUpload
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.core import PagedResponseSchema
from data_ingestion.schemas.upload import (
    FileUpload as FileUploadSchema,
)

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(azure_scheme)],
)


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
        query = query.where(FileUpload.uploader_id == user.sub)

    if id_search:
        query = query.where(func.starts_with(FileUpload.id, id_search))

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    items = await db.scalars(
        query.order_by(desc(FileUpload.created))
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

    if not is_privileged and file_upload.uploader_id != user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access details for this file.",
        )

    return file_upload


@router.post("", response_model=FileUploadSchema)
async def upload_file(
    response: Response,
    column_to_schema_mapping: Annotated[str, Form()],
    column_license: Annotated[str, Form()],
    country: Annotated[str, Form()],
    data_collection_date: Annotated[AwareDatetime, Form()],
    data_collection_modality: Annotated[str, Form()],
    data_owner: Annotated[str, Form()],
    dataset: str,
    date_modified: Annotated[AwareDatetime, Form()],
    description: Annotated[str, Form()],
    domain: Annotated[str, Form()],
    file: UploadFile,
    pii_classification: Annotated[str, Form()],
    school_id_type: Annotated[str, Form()],
    sensitivity_level: Annotated[str, Form()],
    geolocation_data_source: Annotated[str | None, Form()] = None,
    source: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    if not is_privileged:
        country_dataset = f"{country}-School {dataset.capitalize()}"
        if country_dataset not in user.groups:
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

    country_code = coco.convert(country, to="ISO3")
    email = user.email or user.claims.get("email")
    if email is None:
        email = (await UsersApi.get_user(user.sub)).mail

    file_upload = FileUpload(
        uploader_id=user.sub,
        uploader_email=email,
        country=country_code,
        dataset=dataset,
        source=source,
        original_filename=file.filename,
        column_to_schema_mapping=column_to_schema_mapping,
        column_license=column_license,
    )
    db.add(file_upload)
    await db.commit()

    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            "sensitivity_level": sensitivity_level,
            "pii_classification": pii_classification,
            "geolocation_data_source": geolocation_data_source,
            "data_collection_date": data_collection_date.isoformat(),
            "data_collection_modality": data_collection_modality,
            "domain": domain,
            "date_modified": date_modified.isoformat(),
            "data_owner": data_owner,
            "country": country,
            "school_id_type": school_id_type,
            "description_file_update": description,
        }

        if source is not None:
            metadata["source"] = source

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

    if not is_privileged:
        if file_upload.uploader_id != user.sub:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access details for this file.",
            )

    blob_properties, results = get_first_n_error_rows_for_data_quality_check(
        file_upload.dq_report_path
    )
    dq_report_summary_dict = get_data_quality_summary(file_upload.dq_report_path)

    return {
        "name": blob_properties.name,
        "creation_time": blob_properties.creation_time.isoformat(),
        "dq_summary": dq_report_summary_dict,
        "dq_failed_rows_first_five_rows": results,
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
        if file_upload.uploader_id != user.sub:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access details for this file.",
            )

    blob_list = storage_client.list_blobs(name_starts_with=file_upload.dq_report_path)
    first_blob = next(blob_list, None)

    blob = storage_client.get_blob_client(first_blob.name)
    stream = blob.download_blob()
    headers = {"Content-Disposition": f"attachment; filename={first_blob.name}"}

    return StreamingResponse(
        stream.chunks(),
        media_type="application/octet-stream",
        headers=headers,
    )
