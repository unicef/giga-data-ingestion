from datetime import datetime
from uuid import uuid4

import country_converter as coco
from azure.core.exceptions import HttpResponseError
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Security,
    UploadFile,
    status,
)

from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.schemas.upload import UploadFileMetadata

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
    metadata: UploadFileMetadata = Depends(),
):
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )
    uid = str(uuid4())

    country_code = coco.convert(metadata.country, to="ISO3")
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")

    filename = (
        f"raw/uploads/{uid}_{country_code}_"
        f"{dataset}_{metadata.source}-{timestamp}"
    )
    client = storage_client.get_blob_client(filename)

    try:
        client.upload_blob(await file.read(), metadata=metadata.dict())
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
