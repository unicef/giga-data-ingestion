from io import BytesIO
from pathlib import Path

import pandas as pd
from country_converter import country_converter as coco
from fastapi import APIRouter, Security

from azure.storage.blob import BlobProperties
from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.schemas.approval_requests import ApprovalRequestListing

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    dependencies=[Security(azure_scheme)],
)


@router.get("/", response_model=list[ApprovalRequestListing])
async def list_approval_requests():
    body: list[ApprovalRequestListing] = []

    for blob in storage_client.list_blobs(constants.APPROVAL_REQUESTS_PATH_PREFIX):
        blob: BlobProperties
        path = Path(blob.name)
        if path.suffix == ".csv" and len(country_iso3 := path.name.split("_")[0]) == 3:
            with BytesIO() as buffer:
                storage_client.download_blob(blob.name).readinto(buffer)
                buffer.seek(0)
                df = pd.read_csv(
                    buffer, low_memory=True, usecols=["_change_type"], dtype="string"
                )

            body.append(
                ApprovalRequestListing(
                    country=coco.convert(country_iso3, to="name_short"),
                    country_iso3=country_iso3,
                    dataset=path.parent.name.replace("-", " ").title(),
                    last_modified=blob.last_modified,
                    rows_added=df[df["_change_type"] == "insert"].count(),
                    rows_updated=df[df["_change_type"] == "update_preimage"].count(),
                    rows_deleted=df[df["_change_type"] == "delete"].count(),
                )
            )

    return body
