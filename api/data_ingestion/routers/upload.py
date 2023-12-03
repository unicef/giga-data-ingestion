from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    Security,
    UploadFile,
    status,
)

from data_ingestion.constants import constants
from data_ingestion.internal.auth import oauth_scheme, oidc_scheme
from data_ingestion.internal.storage import storage_client

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(oidc_scheme)],
)


@router.post("")
async def upload_file(
    request: Request, response: Response, file: UploadFile, token=Depends(oidc_scheme)
):
    user = oauth_scheme.data_ingestion.parse_id_token(
        request, token={"id_token": token}
    )
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
    client.upload_blob(await file.read(), metadata=metadata)
    response.status_code = status.HTTP_201_CREATED
