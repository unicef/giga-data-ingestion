import json
import urllib.parse
from datetime import datetime
from pathlib import Path

import pandas as pd
from country_converter import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import column, func, literal, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import count

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db as get_primary_db
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.internal.users import UsersApi
from data_ingestion.models import ApprovalRequest
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.approval_requests import (
    ApprovalRequestListing,
    UploadApprovedRowsRequest,
)
from data_ingestion.schemas.core import PagedResponseSchema

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    dependencies=[Security(IsPrivileged())],
)


@router.get(
    "",
    response_model=PagedResponseSchema[ApprovalRequestListing],
)
async def list_approval_requests(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    primary_db: AsyncSession = Depends(get_primary_db),
):
    base_query = select(ApprovalRequest).order_by(
        ApprovalRequest.country, ApprovalRequest.dataset
    )
    items = await primary_db.scalars(base_query)
    settings = {}
    for item in items:
        settings[f"{item.country}-{item.dataset}"] = item.enabled

    data_cte = (
        select("*")
        .select_from(text("information_schema.tables"))
        .where(column("table_schema").like(literal("school%staging")))
        .cte("tables")
    )
    res = db.execute(
        select("*", select(count()).select_from(data_cte).label("total_count"))
        .select_from(data_cte)
        .order_by(column("table_name"))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    staging_tables = res.mappings().all()
    if len(staging_tables) == 0:
        total_count = 0
    else:
        total_count = staging_tables[0]["total_count"]

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
        country_iso3 = coco.convert(table["table_name"], to="ISO3")

        dataset = (
            table["table_schema"]
            .replace("staging", "")
            .replace("_", " ")
            .title()
            .rstrip()
        )
        body.append(
            ApprovalRequestListing(
                id=f'{table["table_name"].upper()}-{dataset}',
                country=country,
                country_iso3=table["table_name"].upper(),
                dataset=dataset,
                subpath=f'{table["table_schema"]}/{table["table_name"]}',
                last_modified=stats["last_modified"],
                rows_count=stats["rows_count"],
                rows_added=stats["rows_added"],
                rows_updated=stats["rows_updated"],
                rows_deleted=0,
                enabled=settings[f"{country_iso3}-{dataset}"],
            )
        )

    return {
        "data": body,
        "page": 1,
        "page_size": 10,
        "total_count": total_count,
    }


@router.get("/{subpath}")
async def get_approval_request(
    subpath: str,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    if len(splits := urllib.parse.unquote(subpath).split("/")) != 2:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    table_schema, table_name = splits
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
    detail = (
        db.execute(
            select("*")
            .select_from(text(f'{table_schema}."{table_name}$history"'))
            .order_by(column("version").desc())
            .limit(1)
        )
        .mappings()
        .first()
    )

    df = pd.DataFrame(cdf)
    total_count = int(df.at[0, "row_count"])
    df = df.drop(columns=["row_count", "signature"]).fillna("NULL")
    return {
        "info": {
            "country": country,
            "dataset": dataset.title(),
            "version": detail["version"],
            "timestamp": detail["timestamp"],
        },
        "total_count": total_count,
        "data": df.to_dict(orient="records"),
    }


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_approved_rows(
    body: UploadApprovedRowsRequest,
    user=Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
):
    posix_path = Path(urllib.parse.unquote(body.subpath))
    dataset = posix_path.parent.name.replace("_staging", "").replace("_", "-")
    country_iso3 = posix_path.name.split("_")[0].upper()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    filename = f"{country_iso3}_{dataset}_{timestamp}.json"

    approve_location = (
        f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}"
        f"/approved-row-ids/{dataset}/{country_iso3}/{filename}"
    )

    email = user.email or user.claims.get("email")
    if email is None:
        email = (await UsersApi.get_user(user.sub)).mail

    approve_client = storage_client.get_blob_client(approve_location)
    try:
        approve_client.upload_blob(
            json.dumps(
                body.approved_rows,
            ),
            overwrite=True,
            metadata={"approver_email": email},
            content_settings=ContentSettings(content_type="application/json"),
        )

        formatted_dataset = dataset.replace("-", " ").title()
        update_query = (
            update(ApprovalRequest)
            .where(
                ApprovalRequest.country == country_iso3,
                ApprovalRequest.dataset == formatted_dataset,
            )
            .values(enabled=False)
        )
        await primary_db.execute(update_query)
        await primary_db.commit()

    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
