from datetime import datetime
from typing import Annotated
from uuid import uuid4

import country_converter as coco
from azure.core.exceptions import HttpResponseError
from fastapi import (
    APIRouter,
    File,
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
    domain: Annotated[str, Form()],
    date_modified: Annotated[str, Form()],
    source: Annotated[str, Form()],
    data_owner: Annotated[str, Form()],
    country: Annotated[str, Form()],
    school_id_type: Annotated[str, Form()],
    description_file_update: Annotated[str, Form()],
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
            "data_collection_modality": data_collection_modality,
            "domain": domain,
            "date_modified": date_modified,
            "source": source,
            "data_owner": data_owner,
            "country": country,
            "school_id_type": school_id_type,
            "description_file_update": description_file_update,
        }

        client.upload_blob(await file.read(), metadata=metadata)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
