import json
import urllib.parse
from datetime import datetime
from pathlib import Path

import pandas as pd
from country_converter import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi_azure_auth.user import User
from sqlalchemy import (
    column,
    distinct,
    func,
    literal,
    select,
    text,
    update,
)
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
from data_ingestion.models import (
    ApprovalRequest,
    User as DatabaseUser,
)
from data_ingestion.models.approval_requests import ApprovalRequestAuditLog
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
        select(
            "*",
            func.concat_WS(".", column("table_schema"), column("table_name")).label(
                "full_name"
            ),
        )
        .select_from(text("information_schema.tables"))
        .where(
            (column("table_schema").like(literal("school%staging")))
            & (column("table_name").in_(table_names))
        )
        .cte("tables")
    )

    res = db.execute(
        select(
            "*",
            select(count(distinct(column("full_name"))))
            .select_from(data_cte)
            .label("total_count"),
        )
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

    for table in staging_tables:
        history_query = (
            select(column("timestamp"))
            .select_from(
                text(
                    f'''delta_lake.{table['table_schema']}."{table['table_name']}$history"'''
                )
            )
            .order_by(column("timestamp").desc())
            .limit(1)
        )
        last_modified = db.execute(history_query).scalar()

        min_version_query = select(func.min(column("version"))).select_from(
            text(
                f'''delta_lake.{table['table_schema']}."{table['table_name']}$history"'''
            )
        )
        min_version = db.execute(min_version_query).scalar()

        changes_query = select(
            column("school_id_giga"), column("_change_type"), column("_commit_version")
        ).select_from(
            func.table(
                func.delta_lake.system.table_changes(
                    literal(table["table_schema"]),
                    literal(table["table_name"]),
                    literal(min_version),
                )
            )
        )

        changes = db.execute(changes_query).all()

        true_max_version = 0
        if changes:
            true_max_version = max(c[2] for c in changes)

        total_school_ids = set()
        rows_added = set()
        rows_updated = set()
        rows_deleted = set()

        for school_id, change_type, commit_version in changes:
            is_approvable = (
                (true_max_version == 1 and commit_version == 1)
                or (commit_version == 2)
                or (commit_version > 2 and change_type != "update_preimage")
            )

            if is_approvable:
                total_school_ids.add(school_id)

                if change_type == "insert":
                    rows_added.add(school_id)
                elif change_type == "update_postimage":
                    rows_updated.add(school_id)
                elif change_type == "delete":
                    rows_deleted.add(school_id)

        country = coco.convert(table["table_name"], to="name_short")
        country_iso3 = coco.convert(table["table_name"], to="ISO3")

        dataset = (
            table["table_schema"]
            .replace("staging", "")
            .replace("_", " ")
            .title()
            .rstrip()
        )
        enabled = settings.get(f"{country_iso3}-{dataset}", False)

        is_delete_operation = (
            len(rows_deleted) > 0 and len(rows_added) == 0 and len(rows_updated) == 0
        )

        body.append(
            ApprovalRequestListing(
                id=f'{table["table_name"].upper()}-{dataset}',
                country=country,
                country_iso3=table["table_name"].upper(),
                dataset=dataset,
                subpath=f'{table["table_schema"]}/{table["table_name"]}',
                last_modified=last_modified,
                rows_count=len(total_school_ids),
                rows_added=len(rows_added),
                rows_updated=len(rows_updated),
                rows_deleted=len(rows_deleted),
                enabled=enabled,
                is_delete_operation=is_delete_operation,
            )
        )

    return {
        "data": body,
        "page": page,
        "page_size": page_size,
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

    changes_query = select(
        func.concat_ws(
            "|",
            column("school_id_giga"),
            column("_change_type"),
            column("_commit_version").cast(String()),
        ).label("change_id"),
        "*",
    ).select_from(
        func.table(
            func.delta_lake.system.table_changes(
                literal(table_schema), literal(table_name), 0
            )
        )
    )

    max_version = db.execute(
        select(func.max(column("_commit_version"))).select_from(
            func.table(
                func.delta_lake.system.table_changes(
                    literal(table_schema), literal(table_name), 0
                )
            )
        )
    ).scalar()

    filtered_query = (
        select("*")
        .select_from(changes_query.subquery())
        .where(
            (literal(max_version) == 1)
            | (column("_commit_version") == 2)
            | (
                (column("_commit_version") > 2)
                & (column("_change_type") != "update_preimage")
            )
        )
    )

    total_count = db.execute(
        select(count()).select_from(filtered_query.subquery())
    ).scalar()

    cdf = (
        db.execute(
            filtered_query.order_by(
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
    df = df.drop(columns=["signature"]).fillna("NULL")
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
    email = user.claims.get("emails")[0]

    database_user = await primary_db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

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
                approved_by_id=database_user.id,
                approved_by_email=database_user.email,
            )
        )
        await primary_db.commit()

    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
