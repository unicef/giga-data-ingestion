import urllib.parse
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd
from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import BlobProperties
from country_converter import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, status

from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.schemas.approval_requests import ApprovalRequestListing

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    # dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[ApprovalRequestListing])
async def list_approval_requests(user=Depends(azure_scheme)):
    groups = [g.lower() for g in user.groups]

    body: list[ApprovalRequestListing] = []
    for blob in storage_client.list_blobs(constants.APPROVAL_REQUESTS_PATH_PREFIX):
        blob: BlobProperties
        path = Path(blob.name)
        country_iso3 = path.name.split("_")[0]
        if len(country_iso3) != 3:
            continue

        country = coco.convert(country_iso3, to="name_short")
        dataset = path.parent.name.replace("-", " ").title()
        country_dataset = f"{country}-{dataset}".lower()

        if path.suffix == ".csv" and (
            "admin" in groups or "super" in groups or country_dataset in groups
        ):
            with BytesIO() as buffer:
                storage_client.download_blob(blob.name).readinto(buffer)
                buffer.seek(0)
                df = pd.read_csv(
                    buffer, low_memory=True, usecols=["_change_type"], dtype="string"
                )

            body.append(
                ApprovalRequestListing(
                    country=country,
                    country_iso3=country_iso3,
                    dataset=dataset,
                    subpath=blob.name.replace(
                        f"{constants.APPROVAL_REQUESTS_PATH_PREFIX}/", ""
                    ),
                    last_modified=blob.last_modified,
                    rows_count=df[df["_change_type"] != "update_postimage"].count(),
                    rows_added=df[df["_change_type"] == "insert"].count(),
                    rows_updated=df[df["_change_type"] == "update_preimage"].count(),
                    rows_deleted=df[df["_change_type"] == "delete"].count(),
                )
            )

    return body


@router.get("/{subpath}")
async def get_approval_request(subpath: str, user=Depends(azure_scheme)):
    groups = [g.lower() for g in user.groups]
    subpath = urllib.parse.unquote(subpath)
    subpath = Path(subpath)
    dataset = subpath.parent.name.replace("-", " ")
    country_iso3 = subpath.name.split("_")[0]
    country = coco.convert(country_iso3, to="name_short")
    country_dataset = f"{country}-{dataset}".lower()

    if not ("admin" in groups or "super" in groups or country_dataset in groups):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    try:
        blob = storage_client.download_blob(
            f"{constants.APPROVAL_REQUESTS_PATH_PREFIX}/{subpath}"
        )
    except ResourceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from exc

    with BytesIO() as buffer:
        blob.readinto(buffer)
        buffer.seek(0)
        df = (
            pd.read_csv(buffer, dtype="string").fillna(np.nan).replace([np.nan], [None])
        )
        updates = df[
            (df["_change_type"] == "update_preimage")
            | (df["_change_type"] == "update_postimage")
        ]
        for i, row in updates.iterrows():
            if i % 2 != 0:
                continue

            for col in updates.columns:
                if col == "_change_type":
                    continue

                if (old := getattr(row, col)) != (update := updates.at[i + 1, col]):
                    df.at[i, col] = f"~~{old}~~ {update}"

        df = df[df["_change_type"] != "update_postimage"]

    return df.to_dict(orient="records")
