import json
import urllib.parse
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd
from country_converter import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Security, status

from azure.core.exceptions import HttpResponseError, ResourceNotFoundError
from azure.storage.blob import BlobProperties, ContentSettings
from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.schemas.approval_requests import (
    ApprovalRequestListing,
    UploadApprovedRowsRequest,
)

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    dependencies=[Security(azure_scheme)],
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
            pd.read_csv(buffer, dtype="object").fillna(np.nan).replace([np.nan], [None])
        )
        updates = df[
            (df["_change_type"] == "update_preimage")
            | (df["_change_type"] == "update_postimage")
        ]
        for i, row in updates.iterrows():
            if i % 2 != 0:
                continue

            cols_left_of_preimage = df.columns.get_loc("_change_type")
            is_all_null = bool(df.iloc[i, :cols_left_of_preimage].isnull().all())

            if is_all_null is True:
                df.at[i, "_change_type"] = "insert"
                df.iloc[i, :cols_left_of_preimage] = df.iloc[
                    i + 1, :cols_left_of_preimage
                ].values
                continue

            for col in updates.columns:
                if col == "_change_type":
                    continue

                if (old := getattr(row, col)) != (update := updates.at[i + 1, col]):
                    df.at[i, col] = {"old": old, "update": update}

        df = df[df["_change_type"] != "update_postimage"]

    return {
        "info": {"country": country, "dataset": dataset.title()},
        "data": df.to_dict(orient="records"),
    }


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_approved_rows(
    body: UploadApprovedRowsRequest,
    user=Depends(azure_scheme),
):
    subpath = urllib.parse.unquote(body.subpath)
    subpath = Path(subpath)
    dataset = subpath.parent.name
    country_iso3 = subpath.name.split("_")[0]
    filename = subpath.name.split("_")[1].split(".")[0]

    approve_filename = f"{country_iso3}_{dataset}_{filename}.json"
    client = storage_client.get_blob_client(f"raw/uploads_DEV/mock/{approve_filename}")

    try:
        client.upload_blob(
            json.dumps(body.approved_rows),
            overwrite=True,
            content_settings=ContentSettings(content_type="application/json"),
        )

    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ) from err
