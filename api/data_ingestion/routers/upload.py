import asyncio
import os
from typing import Annotated

import country_converter as coco
import magic
from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Response,
    Security,
    UploadFile,
    status,
)
from fastapi_azure_auth.user import User
from pydantic import AwareDatetime
from sqlalchemy.ext.asyncio import AsyncSession

from azure.core.exceptions import HttpResponseError
from data_ingestion.constants import constants
from data_ingestion.db import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.mocks.upload_checks import get_upload_checks
from data_ingestion.models import FileUpload

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(azure_scheme)],
)


@router.post("")
async def upload_file(
    response: Response,
    file: UploadFile,
    dataset: str,
    sensitivity_level: Annotated[str, Form()],
    pii_classification: Annotated[str, Form()],
    geolocation_data_source: Annotated[str, Form()],
    data_collection_modality: Annotated[str, Form()],
    data_collection_date: Annotated[AwareDatetime, Form()],
    domain: Annotated[str, Form()],
    date_modified: Annotated[AwareDatetime, Form()],
    data_owner: Annotated[str, Form()],
    country: Annotated[str, Form()],
    school_id_type: Annotated[str, Form()],
    description: Annotated[str, Form()],
    source: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
):
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )

    valid_types = {
        "application/json": [".json"],
        "application/octet-stream": [".parquet"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "text/csv": [".csv"],
    }

    file_content = await file.read(2048)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    if file_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_extension not in valid_types[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match file type.",
        )

    country_code = coco.convert(country, to="ISO3")

    file_upload = FileUpload(
        uploader_id=user.sub,
        uploader_email=user.email or user.upn,
        country=country_code,
        dataset=dataset,
        source=source,
        original_filename=file.filename,
    )
    db.add(file_upload)
    await db.commit()

    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            "sensitivity_level": sensitivity_level,
            "pii_classification": pii_classification,
            "geolocation_data_source": geolocation_data_source,
            "data_collection_date": data_collection_date.strftime(
                "%Y-%m-%d %H:%M:%S %Z%z"
            ),
            "data_collection_modality": data_collection_modality,
            "domain": domain,
            "date_modified": date_modified.strftime("%Y-%m-%d %H:%M:%S %Z%z"),
            "data_owner": data_owner,
            "country": country,
            "school_id_type": school_id_type,
            "description_file_update": description,
        }

        if source is not None:
            metadata["source"] = source

        client.upload_blob(await file.read(), metadata=metadata)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        await db.delete(file_upload)
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err

    return file_upload.id


@router.get(
    "",
)
async def list_column_checks():
    await asyncio.sleep(2)

    # TODO replace with upload
    upload_checks = get_upload_checks()

    return upload_checks
