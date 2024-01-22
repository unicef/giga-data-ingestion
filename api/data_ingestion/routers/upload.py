from uuid import uuid4

from azure.core.exceptions import HttpResponseError
from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Security,
    UploadFile,
    status,
)
from fastapi_azure_auth.user import User

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(azure_scheme)],
)


@router.post("")
async def upload_file(
    response: Response, file: UploadFile, user: User = Depends(azure_scheme)
):
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )
    uid = str(uuid4())
    metadata = {
        "id": uid,
        "uploader": user.email or user.preferred_username,
        "original_filename": file.filename,
    }
    filename = f"{user.sub}/{uid[:8]}-{file.filename}"
    client = storage_client.get_blob_client(filename)

    try:
        client.upload_blob(await file.read(), metadata=metadata)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        )
