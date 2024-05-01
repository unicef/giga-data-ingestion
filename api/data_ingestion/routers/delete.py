import json
from datetime import datetime

import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Response, Security, status
from fastapi_azure_auth.user import User
from sqlalchemy.ext.asyncio import AsyncSession

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.delete import DeleteRowsRequest, DeleteRowsSchema

router = APIRouter(
    prefix="/api/delete",
    tags=["delete"],
    dependencies=[Security(azure_scheme)],
)


@router.post("", response_model=DeleteRowsSchema)
async def delete_rows(
    response: Response,
    body: DeleteRowsRequest,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    if not is_privileged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this endpoint",
        )

    country_iso3 = coco.convert(body.country, to="ISO3")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    filename = f"{country_iso3}_{timestamp}.json"

    approve_location = (
        f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}"
        f"/delete-row-ids/{country_iso3}/{filename}"
    )

    approve_client = storage_client.get_blob_client(approve_location)

    try:
        approve_client.upload_blob(
            json.dumps(body.ids),
            overwrite=True,
            metadata={"email": user.sub},
            content_settings=ContentSettings(content_type="appication/json"),
        )
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err

    return {"filename": filename}
