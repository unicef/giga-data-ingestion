import json
import urllib.parse
from datetime import datetime
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
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.approval_requests import (
    ApprovalRequestListing,
    UploadApprovedRowsRequest,
)

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    dependencies=[Security(azure_scheme)],
)


@router.get(
    "",
    response_model=list[ApprovalRequestListing],
    dependencies=[Security(IsPrivileged())],
)
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


@router.get(
    "/{subpath}",
    dependencies=[Security(IsPrivileged())],
)
async def get_approval_request(
    subpath: str,
    user=Depends(azure_scheme),
):
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

        for i, row in df.iterrows():
            if df.at[i, "_change_type"] in ["update_postimage", "insert"]:
                continue

            for col in df.columns:
                if col == "_change_type":
                    continue

                if (old := getattr(row, col)) != (update := df.at[i + 1, col]):
                    df.at[i, col] = {"old": old, "update": update}

        df = df[df["_change_type"] != "update_postimage"]
        cols = ["school_id_giga"] + [col for col in df if col != "school_id_giga"]
        df = df.reindex(columns=cols)

    return {
        "info": {"country": country, "dataset": dataset.title()},
        "data": df.to_dict(orient="records"),
    }


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Security(IsPrivileged())],
)
async def upload_approved_rows(
    body: UploadApprovedRowsRequest,
    user=Depends(azure_scheme),
):
    posix_path = Path(urllib.parse.unquote(body.subpath))
    dataset = posix_path.parent.name
    country_iso3 = posix_path.name.split("_")[0]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    filename = f"{country_iso3}_{dataset}_{timestamp}.json"

    approve_location = (
        f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}"
        f"/{dataset}/approved-rows/{filename}"
    )
    reject_location = (
        f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}"
        f"/{dataset}/rejected-rows/{filename}"
    )

    approve_client = storage_client.get_blob_client(approve_location)
    reject_client = storage_client.get_blob_client(reject_location)

    try:
        approve_client.upload_blob(
            json.dumps(body.approved_rows),
            overwrite=True,
            content_settings=ContentSettings(content_type="application/json"),
        )

        reject_client.upload_blob(
            json.dumps(body.rejected_rows),
            overwrite=True,
            content_settings=ContentSettings(content_type="application/json"),
        )
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
