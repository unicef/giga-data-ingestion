import json
from datetime import datetime

import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi_azure_auth.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import (
    DeletionRequest,
    User as DatabaseUser,
)
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.deletion_requests import DeleteRowsRequest, DeleteRowsSchema
from data_ingestion.utils.user import get_user_email

router = APIRouter(
    prefix="/api/delete",
    tags=["deletion-requests"],
    dependencies=[Security(IsPrivileged())],
)


@router.post("", response_model=DeleteRowsSchema)
async def delete_rows(
    body: DeleteRowsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
):
    country_iso3 = coco.convert(body.country, to="ISO3")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    email = await get_user_email(user)

    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

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
            metadata={"requester_email": database_user.email},
            content_settings=ContentSettings(content_type="application/json"),
        )
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err

    async with db.begin():
        db.add(
            DeletionRequest(
                requested_by_email=database_user.email,
                requested_by_id=database_user.id,
                country=country_iso3,
            )
        )

    return {"filename": filename}
