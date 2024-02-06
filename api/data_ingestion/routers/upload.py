import asyncio
from datetime import datetime
from typing import Annotated
from uuid import uuid4

import country_converter as coco
from azure.core.exceptions import HttpResponseError
from fastapi import (
    APIRouter,
    Form,
    HTTPException,
    Response,
    Security,
    UploadFile,
    status,
)

from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.mocks.upload_checks import get_upload_checks

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
    data_collection_date: Annotated[str, Form()],
    domain: Annotated[str, Form()],
    date_modified: Annotated[str, Form()],
    data_owner: Annotated[str, Form()],
    country: Annotated[str, Form()],
    school_id_type: Annotated[str, Form()],
    description: Annotated[str, Form()],
    source: str | None = Form(None),
):
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )
    uid = str(uuid4())

    country_code = coco.convert(country, to="ISO3")
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")

    filename = f"raw/uploads/{uid}_{country_code}_" f"{dataset}_{source}-{timestamp}"
    client = storage_client.get_blob_client(filename)

    try:
        metadata = {
            "sensitivity_level": sensitivity_level,
            "pii_classification": pii_classification,
            "geolocation_data_source": geolocation_data_source,
            "data_collection_date": data_collection_date,
            "data_collection_modality": data_collection_modality,
            "domain": domain,
            "date_modified": date_modified,
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
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err

    return uid


@router.get(
    "",
)
async def list_column_checks():
    await asyncio.sleep(2)

    # TODO replace with upload
    upload_checks = get_upload_checks()

    return upload_checks
