import json
import urllib.parse
from datetime import datetime
from pathlib import Path

import pandas as pd
from country_converter import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi_azure_auth.user import User
from sqlalchemy import column, func, literal, select, text, union_all, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import count
from sqlalchemy.types import String

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db as get_primary_db
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import ApprovalRequest
from data_ingestion.models.approval_requests import ApprovalRequestAuditLog
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.approval_requests import (
    ApprovalRequestListing,
    UploadApprovedRowsRequest,
)
from data_ingestion.schemas.core import PagedResponseSchema
from data_ingestion.utils.user import get_user_email

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
    base_query = (
        select(ApprovalRequest)
        .where(ApprovalRequest.enabled)
        .order_by(ApprovalRequest.country, ApprovalRequest.dataset)
    )
    items = await primary_db.scalars(base_query)
    settings = {}
    table_names = []
    for item in items:
        settings[f"{item.country}-{item.dataset}"] = item.enabled
        table_names.append(item.country.lower())

    data_cte = (
        select("*")
        .select_from(text("information_schema.tables"))
        .where(
            (column("table_schema").like(literal("school%staging")))
            & (column("table_name").in_(table_names))
        )
        .cte("tables")
    )
    res = db.execute(
        select("*", select(count()).select_from(data_cte).label("total_count"))
        .select_from(data_cte)
        .order_by(column("table_name"), column("table_schema"))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    staging_tables = res.mappings().all()
    if len(staging_tables) == 0:
        total_count = 0
    else:
        total_count = staging_tables[0]["total_count"]

    body: list[ApprovalRequestListing] = []
    queries = []
    for table in staging_tables:
        change_types_cte = (
            select(
                column("school_id_giga"),
                column("_change_type"),
                column("_commit_version"),
            ).select_from(
                func.table(
                    func.delta_lake.system.table_changes(
                        literal(table["table_schema"]), literal(table["table_name"]), 0
                    )
                )
            )
        ).cte(f"change_types_{table['table_schema']}_{table['table_name']}")
        timestamp_cte = (
            select(column("timestamp"))
            .select_from(
                text(
                    f'''delta_lake.{table['table_schema']}."{table['table_name']}$history"'''
                )
            )
            .order_by(column("timestamp").desc())
            .limit(1)
        ).cte(f"timestamp_{table['table_schema']}_{table['table_name']}")
        query = select(
            literal(table["table_schema"]).label("table_schema"),
            literal(table["table_name"]).label("table_name"),
            (
                select(count(column("school_id_giga").distinct())).select_from(
                    change_types_cte
                )
            ).label("rows_count"),
            (
                select(count())
                .select_from(change_types_cte)
                .where(
                    (column("_change_type") == literal("insert"))
                    & (column("_commit_version") > 1)
                )
            ).label("rows_added"),
            (
                select(count())
                .select_from(change_types_cte)
                .where(column("_change_type") == literal("update_postimage"))
            ).label("rows_updated"),
            (
                select(count())
                .select_from(change_types_cte)
                .where(column("_change_type") == literal("delete"))
            ).label("rows_deleted"),
            (select(column("timestamp")).select_from(timestamp_cte)).label(
                "last_modified"
            ),
        )
        queries.append(query)

    if len(queries) > 0:
        res = db.execute(union_all(*queries))
        stats = res.mappings().all()

        for stat in stats:
            country = coco.convert(stat["table_name"], to="name_short")
            country_iso3 = coco.convert(stat["table_name"], to="ISO3")

            dataset = (
                stat["table_schema"]
                .replace("staging", "")
                .replace("_", " ")
                .title()
                .rstrip()
            )
            enabled = settings.get(f"{country_iso3}-{dataset}", False) and (
                stat["rows_added"] > 0
                or stat["rows_updated"] > 0
                or stat["rows_deleted"] > 0
            )

            body.append(
                ApprovalRequestListing(
                    id=f'{stat["table_name"].upper()}-{dataset}',
                    country=country,
                    country_iso3=stat["table_name"].upper(),
                    dataset=dataset,
                    subpath=f'{stat["table_schema"]}/{stat["table_name"]}',
                    last_modified=stat["last_modified"],
                    rows_count=stat["rows_count"],
                    rows_added=stat["rows_added"],
                    rows_updated=stat["rows_updated"],
                    rows_deleted=stat["rows_deleted"],
                    enabled=enabled,
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
    page_size: int = Query(default=10, ge=1, le=100),
):
    if len(splits := urllib.parse.unquote(subpath).split("/")) != 2:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    table_schema, table_name = splits
    country = coco.convert(table_name, to="name_short")
    dataset = table_schema.replace("staging", "").replace("_", " ").title()

    data_cte = (
        select(
            # Create an identifier that is unique across versions
            func.concat_ws(
                "|",
                column("school_id_giga"),
                column("_change_type"),
                column("_commit_version").cast(String()),
            ).label("change_id"),
            "*",
        )
        .select_from(
            func.table(
                func.delta_lake.system.table_changes(
                    literal(table_schema), literal(table_name), 0
                )
            )
        )
        .where(
            (column("_commit_version") == 2)
            | (
                (column("_commit_version") > 2)
                & (column("_change_type") != "update_preimage")
            )
        )
        .cte("changes")
    )
    cdf = (
        db.execute(
            select("*", select(count()).select_from(data_cte).label("row_count"))
            .select_from(data_cte)
            .order_by(
                column("school_id_giga"),
                column("_commit_version").desc(),
                column("_change_type").desc(),
            )
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
    user: User = Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
):
    posix_path = Path(urllib.parse.unquote(body.subpath))
    dataset = posix_path.parent.name.replace("_staging", "").replace("_", "-")
    country_iso3 = posix_path.name.split("_")[0].upper()
    timestamp = datetime.now().strftime(constants.FILENAME_TIMESTAMP_FORMAT)

    filename = f"{country_iso3}_{dataset}_{timestamp}.json"
    approve_location = f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}/approved-row-ids/{dataset}/{country_iso3}/{filename}"
    email = await get_user_email(user)

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

        async with primary_db.begin():
            obj = await primary_db.execute(
                update(ApprovalRequest)
                .where(
                    (ApprovalRequest.country == country_iso3)
                    & (ApprovalRequest.dataset == formatted_dataset)
                )
                .values(
                    {
                        ApprovalRequest.enabled: False,
                        ApprovalRequest.is_merge_processing: True,
                    }
                )
                .returning(column("id"))
            )
            primary_db.add(
                ApprovalRequestAuditLog(
                    approval_request_id=obj.first().id,
                    approved_by_id=user.sub,
                    approved_by_email=email,
                )
            )

    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
