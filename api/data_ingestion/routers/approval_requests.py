import json
import urllib.parse
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
from country_converter import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import column, func, literal, select, text
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import count

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.trino import get_db
from data_ingestion.internal.storage import storage_client
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.approval_requests import (
    ApprovalRequestListing,
    UploadApprovedRowsRequest,
)

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    dependencies=[Security(IsPrivileged())],
)


@router.get(
    "",
    response_model=list[ApprovalRequestListing],
)
async def list_approval_requests(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    res = db.execute(
        select("*")
        .select_from(text("information_schema.tables"))
        .where(column("table_schema").like(literal("school%staging")))
        .order_by(column("table_name"))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    staging_tables = res.mappings().all()

    body: list[ApprovalRequestListing] = []
    for table in staging_tables:
        change_types_cte = (
            select(column("_change_type")).select_from(
                func.table(
                    func.delta_lake.system.table_changes(
                        literal(table["table_schema"]), literal(table["table_name"]), 0
                    )
                )
            )
        ).cte("change_types")
        timestamp_cte = (
            select(column("timestamp"))
            .select_from(
                text(
                    f'''delta_lake.{table['table_schema']}."{table['table_name']}$history"'''
                )
            )
            .order_by(column("timestamp").desc())
            .limit(1)
        ).cte("timestamp")
        res = db.execute(
            select(
                (select(count()).select_from(change_types_cte)).label("rows_count"),
                (
                    select(count())
                    .select_from(change_types_cte)
                    .where(column("_change_type") == literal("insert"))
                ).label("rows_added"),
                (
                    select(count())
                    .select_from(change_types_cte)
                    .where(column("_change_type") == literal("update_preimage"))
                ).label("rows_updated"),
                (select(column("timestamp")).select_from(timestamp_cte)).label(
                    "last_modified"
                ),
            )
        )
        stats = res.mappings().one()

        country = coco.convert(table["table_name"], to="name_short")
        dataset = table["table_schema"].replace("staging", "").replace("_", " ").title()
        body.append(
            ApprovalRequestListing(
                country=country,
                country_iso3=table["table_name"].upper(),
                dataset=dataset,
                subpath=f'{table["table_schema"]}/{table["table_name"]}',
                last_modified=datetime.now().astimezone(ZoneInfo("UTC")),
                rows_count=stats["rows_count"],
                rows_added=stats["rows_added"],
                rows_updated=stats["rows_updated"],
                rows_deleted=0,
            )
        )

    return body


@router.get("/{subpath}")
async def get_approval_request(
    subpath: str,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    table_schema, table_name = urllib.parse.unquote(subpath).split("/")
    country = coco.convert(table_name, to="name_short")
    dataset = table_schema.replace("staging", "").replace("_", " ").title()

    data_cte = (
        select("*")
        .select_from(
            func.table(
                func.delta_lake.system.table_changes(
                    literal(table_schema), literal(table_name), 0
                )
            )
        )
        .cte("changes")
    )
    cdf = (
        db.execute(
            select("*", select(count()).select_from(data_cte).label("row_count"))
            .select_from(data_cte)
            .order_by(column("school_id_giga"), column("_change_type").desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .mappings()
        .all()
    )

    for i, row in (df := pd.DataFrame(cdf)).iterrows():
        if row["_change_type"] in ["update_postimage", "insert"]:
            continue

        for col in df.columns:
            if col == "_change_type":
                continue

            if (old := getattr(row, col)) != (update := df.at[i + 1, col]):
                df.at[i, col] = {"old": old, "update": update}

    total_count = int(df.at[0, "row_count"])
    df = df[df["_change_type"] != "update_postimage"]
    df = df.drop(
        columns=["row_count", "signature", "_commit_version", "_commit_timestamp"]
    )
    return {
        "info": {"country": country, "dataset": dataset.title()},
        "total_count": total_count,
        "data": df.to_dict(orient="records"),
    }


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_approved_rows(body: UploadApprovedRowsRequest):
    subpath = urllib.parse.unquote(body.subpath)
    subpath = Path(subpath)
    dataset = subpath.parent.name
    country_iso3 = subpath.name.split("_")[0]
    filename = subpath.name.split("_")[1].split(".")[0]

    filename = f"{country_iso3}_{dataset}_{filename}.json"

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
