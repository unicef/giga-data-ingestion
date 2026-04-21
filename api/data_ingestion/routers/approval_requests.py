import json
import urllib.parse
from datetime import UTC, datetime
from typing import Optional

import country_converter as coco
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi_azure_auth.user import User
from sqlalchemy import (
    column,
    func,
    literal,
    select,
    text,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.types import String

from data_ingestion.db.primary import get_db as get_primary_db
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import (
    ApprovalRequest,
    DQRun,
    FileUpload,
    User as DatabaseUser,
)
from data_ingestion.models.approval_requests import ApprovalRequestAuditLog, DQModeEnum
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.approval_requests import (
    ApprovalByUploadResponse,
    ApprovalFilterByUploadRequest,
    ApprovalRequestInfo,
    ApproveDatasetRequest,
    CountryPendingListing,
    SubmitApprovalRequest,
    UploadListing,
)
from data_ingestion.schemas.core import PagedResponseSchema

router = APIRouter(
    prefix="/api/approval-requests",
    tags=["approval-requests"],
    dependencies=[Security(IsPrivileged())],
)

_CHANGE_INSERT = "INSERT"
_CHANGE_UPDATE = "UPDATE"
_CHANGE_DELETE = "DELETE"
_CHANGE_UNCHANGED = "UNCHANGED"
_STATUS_PENDING = "PENDING"
_STATUS_APPROVED = "APPROVED"
_STATUS_REJECTED = "REJECTED"


def _staging_table(dataset: str, country_code: str) -> str:
    """Fully-qualified Trino staging (pending_changes) table name."""
    schema = dataset.lower().replace("school ", "")
    return f"delta_lake.school_{schema}_staging.{country_code.lower()}"


def _silver_table(dataset: str, country_code: str) -> str:
    """Fully-qualified Trino silver table name."""
    schema = dataset.lower().replace("school ", "")
    return f"delta_lake.school_{schema}_silver.{country_code.lower()}"


def _in_clause(ids: list[str]) -> str:
    """Build a safe SQL IN clause string from a list of string IDs."""
    escaped = ", ".join(f"'{i.replace(chr(39), '')}'" for i in ids)
    return f"({escaped})"


@router.get("", response_model=PagedResponseSchema[CountryPendingListing])
async def list_countries_with_pending_changes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    primary_db: AsyncSession = Depends(get_primary_db),
    db: Session = Depends(get_db),
):
    """
    List countries that have uploads with PENDING rows in their staging tables.
    Returns one entry per country with aggregate change counts.
    """
    enabled_requests = (
        await primary_db.scalars(
            select(ApprovalRequest)
            .where(ApprovalRequest.enabled)
            .order_by(ApprovalRequest.country)
        )
    ).all()

    if not enabled_requests:
        return {"data": [], "page": page, "page_size": page_size, "total_count": 0}

    # Aggregate pending change counts per country across all datasets
    rows_by_country: dict[str, dict] = {}
    for ar in enabled_requests:
        staging = _staging_table(ar.dataset, ar.country)
        try:
            result = (
                db.execute(
                    text(
                        f"SELECT change_type, COUNT(*) AS cnt"  # nosec B608
                        f" FROM {staging}"
                        f" WHERE status = '{_STATUS_PENDING}'"
                        f" AND change_type != '{_CHANGE_UNCHANGED}'"
                        " GROUP BY change_type"
                    )
                )
                .mappings()
                .all()
            )
        except Exception:
            continue

        if not result:
            continue

        upload_cnt = (
            db.execute(
                text(
                    f"SELECT COUNT(DISTINCT upload_id) FROM {staging}"  # nosec B608
                    f" WHERE status = '{_STATUS_PENDING}'"
                    f" AND change_type != '{_CHANGE_UNCHANGED}'"
                )
            ).scalar()
            or 0
        )

        entry = rows_by_country.setdefault(
            ar.country,
            {
                "rows_added": 0,
                "rows_updated": 0,
                "rows_deleted": 0,
                "pending_uploads": 0,
            },
        )
        for row in result:
            if row["change_type"] == _CHANGE_INSERT:
                entry["rows_added"] += row["cnt"]
            elif row["change_type"] == _CHANGE_UPDATE:
                entry["rows_updated"] += row["cnt"]
            elif row["change_type"] == _CHANGE_DELETE:
                entry["rows_deleted"] += row["cnt"]
        entry["pending_uploads"] += upload_cnt

    total_count = len(rows_by_country)
    sorted_countries = sorted(rows_by_country.keys())
    page_countries = sorted_countries[(page - 1) * page_size : page * page_size]

    body = []
    for iso3 in page_countries:
        entry = rows_by_country[iso3]
        country_name = coco.convert(iso3, to="name_short")
        body.append(
            CountryPendingListing(
                country=country_name if country_name != "not found" else iso3,
                country_iso3=iso3,
                pending_uploads=entry["pending_uploads"],
                rows_added=entry["rows_added"],
                rows_updated=entry["rows_updated"],
                rows_deleted=entry["rows_deleted"],
            )
        )

    return {
        "data": body,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
    }


@router.get("/{country_code}", response_model=PagedResponseSchema[UploadListing])
async def list_uploads_for_country(
    country_code: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    primary_db: AsyncSession = Depends(get_primary_db),
    db: Session = Depends(get_db),
):
    """
    List all pending uploads for a given country across all enabled datasets.
    Each entry represents one upload_id.
    """
    enabled_requests = (
        await primary_db.scalars(
            select(ApprovalRequest).where(
                ApprovalRequest.enabled
                & (ApprovalRequest.country == country_code.upper())
            )
        )
    ).all()

    if not enabled_requests:
        return {"data": [], "page": page, "page_size": page_size, "total_count": 0}

    # Collect per-upload-id change counts across all datasets
    pending_uploads: dict[str, dict] = {}
    for ar in enabled_requests:
        staging = _staging_table(ar.dataset, country_code)
        try:
            rows = (
                db.execute(
                    text(
                        f"SELECT upload_id, change_type, COUNT(*) AS cnt"  # nosec B608
                        f" FROM {staging}"
                        f" WHERE status = '{_STATUS_PENDING}'"
                        " GROUP BY upload_id, change_type"
                    )
                )
                .mappings()
                .all()
            )
        except Exception:
            continue

        for row in rows:
            uid = row["upload_id"]
            entry = pending_uploads.setdefault(
                uid,
                {
                    "dataset": ar.dataset,
                    "is_merge_processing": ar.is_merge_processing,
                    "rows_added": 0,
                    "rows_updated": 0,
                    "rows_deleted": 0,
                    "rows_unchanged": 0,
                },
            )
            ct = row["change_type"]
            if ct == _CHANGE_INSERT:
                entry["rows_added"] += row["cnt"]
            elif ct == _CHANGE_UPDATE:
                entry["rows_updated"] += row["cnt"]
            elif ct == _CHANGE_DELETE:
                entry["rows_deleted"] += row["cnt"]
            elif ct == _CHANGE_UNCHANGED:
                entry["rows_unchanged"] += row["cnt"]

    total_count = len(pending_uploads)

    # Fetch FileUpload metadata for sorting and display
    upload_ids = list(pending_uploads.keys())
    file_uploads = (
        await primary_db.scalars(
            select(FileUpload).where(FileUpload.id.in_(upload_ids))
        )
    ).all()
    file_upload_map = {fu.id: fu for fu in file_uploads}

    sorted_ids = sorted(
        upload_ids,
        key=lambda uid: file_upload_map[uid].created
        if uid in file_upload_map
        else datetime.min.replace(tzinfo=UTC),
        reverse=True,
    )
    page_ids = sorted_ids[(page - 1) * page_size : page * page_size]

    body = []
    for uid in page_ids:
        entry = pending_uploads[uid]
        fu = file_upload_map.get(uid)
        body.append(
            UploadListing(
                upload_id=uid,
                dataset=entry["dataset"],
                uploaded_at=fu.created if fu else datetime.now(UTC),
                uploader_email=fu.uploader_email if fu else "",
                rows_added=entry["rows_added"],
                rows_updated=entry["rows_updated"],
                rows_deleted=entry["rows_deleted"],
                rows_unchanged=entry["rows_unchanged"],
                is_merge_processing=entry["is_merge_processing"],
            )
        )

    return {
        "data": body,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
    }


@router.get("/{country_code}/{upload_id}")
async def get_upload_rows(
    country_code: str,
    upload_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    primary_db: AsyncSession = Depends(get_primary_db),
    db: Session = Depends(get_db),
):
    """
    Paginated rows for a specific upload ready for review.

    - INSERT / DELETE rows: returned as plain column → value records.
    - UPDATE rows: changed cells returned as { "old": <silver_value>, "update": <pending_value> };
      unchanged cells returned as plain values.
    """
    file_upload = await primary_db.scalar(
        select(FileUpload).where(FileUpload.id == upload_id)
    )
    if not file_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )

    staging = _staging_table(file_upload.dataset, country_code)
    silver = _silver_table(file_upload.dataset, country_code)

    total_count = db.execute(
        text(
            f"SELECT COUNT(*) FROM {staging}"  # nosec B608
            f" WHERE upload_id = '{upload_id}'"
            f" AND status = '{_STATUS_PENDING}'"
            f" AND change_type != '{_CHANGE_UNCHANGED}'"
        )
    ).scalar()

    pending_rows = (
        db.execute(
            text(
                f"SELECT * FROM {staging}"  # nosec B608
                f" WHERE upload_id = '{upload_id}'"
                f" AND status = '{_STATUS_PENDING}'"
                f" AND change_type != '{_CHANGE_UNCHANGED}'"
                " ORDER BY change_type, school_id_giga"
                f" OFFSET {(page - 1) * page_size} ROWS FETCH NEXT {page_size} ROWS ONLY"
            )
        )
        .mappings()
        .all()
    )

    if not pending_rows:
        return {
            "info": _build_info(file_upload, country_code),
            "total_count": 0,
            "data": [],
        }

    pending_df = pd.DataFrame(pending_rows)
    drop_cols = {"upload_id", "uploaded_columns", "status", "signature"}
    pending_df = pending_df.drop(
        columns=[c for c in drop_cols if c in pending_df.columns]
    )

    # Fetch silver rows for any UPDATE records to get before-state
    update_ids = pending_df.loc[
        pending_df["change_type"] == _CHANGE_UPDATE, "school_id_giga"
    ].tolist()

    silver_lookup: dict[str, dict] = {}
    if update_ids:
        try:
            silver_rows = (
                db.execute(
                    text(
                        f"SELECT * FROM {silver} WHERE school_id_giga IN {_in_clause(update_ids)}"  # nosec B608
                    )
                )
                .mappings()
                .all()
            )
            silver_lookup = {r["school_id_giga"]: dict(r) for r in silver_rows}
        except Exception:
            pass

    schema_cols = [c for c in pending_df.columns if c != "change_type"]
    records = []
    for _, row in pending_df.iterrows():
        change_type = row["change_type"]
        record: dict = {"_change_type": change_type}

        if change_type == _CHANGE_UPDATE:
            silver_row = silver_lookup.get(row["school_id_giga"], {})
            for col in schema_cols:
                new_val = row[col]
                old_val = silver_row.get(col)
                if old_val is not None and str(old_val) != str(new_val):
                    record[col] = {"old": old_val, "update": new_val}
                else:
                    record[col] = new_val
        else:
            for col in schema_cols:
                record[col] = row[col]

        records.append(record)

    return {
        "info": _build_info(file_upload, country_code),
        "total_count": total_count,
        "data": records,
    }


def _resolve_change_ids(
    rows_input: list[str],
    staging: str,
    upload_id: str,
    db: Session,
) -> list[str]:
    _all = ["__all__"]
    if rows_input == _all:
        return _all
    if not rows_input:
        return []
    query = (
        select(column("school_id_giga"), column("change_type"))
        .select_from(text(staging))
        .where(column("upload_id") == upload_id)
        .where(column("school_id_giga").in_(rows_input))
    )
    rows = db.execute(query).mappings().all()
    id_to_change_type = {r["school_id_giga"]: r["change_type"] for r in rows}
    return [
        f"{sid}|{upload_id}|{id_to_change_type[sid]}"
        for sid in rows_input
        if sid in id_to_change_type
    ]


async def _validate_staging_rows(
    upload_id: str,
    approved_rows: list[str],
    staging: str,
    db: Session,
):
    """Verify that specific approved rows exist in the Trino staging table."""
    approved_rows_set = set(approved_rows)
    if not approved_rows_set or "__all__" in approved_rows_set:
        return

    query = (
        select(column("school_id_giga"))
        .select_from(text(staging))
        .where(column("upload_id") == upload_id)
        .where(column("school_id_giga").in_(approved_rows))
    )
    available_ids = {row[0] for row in db.execute(query).fetchall()}
    missing_ids = approved_rows_set - available_ids
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid approval data: {len(missing_ids)} IDs not found in staging. Missing: {list(missing_ids)[:10]}",
        )


def _persist_approval_to_storage(
    upload_id: str,
    approved_change_ids: list[str],
    rejected_change_ids: list[str],
    approval_request_log_id: Optional[int],
    dq_run_id: int,
    dq_mode: str,
    country_code: str,
    dataset_name: str,
    email: str,
):
    """Write approval JSON to blob storage for Dagster consumption."""
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    approval_filename = f"{country_code.upper()}_school-{dataset_name}_{timestamp}.json"
    dataset_folder = f"school-{dataset_name}"
    approval_path = f"staging/approved-row-ids/{dataset_folder}/{approval_filename}"

    payload = json.dumps(
        {
            "upload_id": upload_id,
            "approved_change_ids": approved_change_ids,
            "rejected_change_ids": rejected_change_ids,
            "approval_request_log_id": approval_request_log_id,
        },
        indent=2,
    )

    storage_client.get_blob_client(approval_path).upload_blob(
        payload.encode(),
        overwrite=True,
        metadata={
            "approver_email": email,
            "dq_mode": dq_mode,
            "dq_run_id": str(dq_run_id),
            "upload_id": upload_id,
        },
    )


@router.post("/{country_code}/{upload_id}/submit", status_code=status.HTTP_200_OK)
async def submit_upload_review(
    country_code: str,
    upload_id: str,
    body: SubmitApprovalRequest,
    user: User = Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
    db: Session = Depends(get_db),
):
    """
    Mark individual rows within an upload as APPROVED or REJECTED.

    Writes an approval JSON file to blob storage so the Dagster sensor can pick it up.
    The file contains change_ids (school_id_giga|upload_id|change_type) for approved
    and rejected rows. Dagster then merges approved rows into the silver table via Spark.

    Special value '__all__' in a list applies that decision to all PENDING rows.
    """
    file_upload = await primary_db.scalar(
        select(FileUpload).where(FileUpload.id == upload_id)
    )
    if not file_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )

    formatted_dataset = f"School {file_upload.dataset.capitalize()}"
    approval_request = await primary_db.scalar(
        select(ApprovalRequest).where(
            (ApprovalRequest.country == country_code.upper())
            & (ApprovalRequest.dataset == formatted_dataset)
        )
    )
    if approval_request and approval_request.is_merge_processing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A merge is already in progress for this dataset. Please wait for it to complete.",
        )

    staging = _staging_table(file_upload.dataset, country_code)

    email = (user.claims.get("emails") or [None])[0]
    oid = user.claims.get("oid")
    if not email or not oid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user claims"
        )

    database_user = await primary_db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    # Build change_ids for approved and rejected rows.
    approved_change_ids = _resolve_change_ids(
        body.approved_rows, staging, upload_id, db
    )
    rejected_change_ids = _resolve_change_ids(
        body.rejected_rows, staging, upload_id, db
    )

    # State check: Validate approved rows exist in Trino change feed BEFORE committing
    try:
        await _validate_staging_rows(upload_id, body.approved_rows, staging, db)
    except HTTPException:
        raise
    except Exception as validation_err:
        print(f"Validation error: {validation_err}")

    # Create DQRun record to track this assessment/submission
    dq_run = DQRun(
        upload_id=file_upload.id,
        dq_mode=DQModeEnum(body.dq_mode),
        status="PENDING",
    )
    primary_db.add(dq_run)
    await primary_db.flush()

    # Create the audit log first
    approval_request_log_id = None
    if approval_request:
        approval_request.is_merge_processing = True
        approval_request.dq_mode = DQModeEnum(body.dq_mode)
        if approved_change_ids and database_user:
            audit_log = ApprovalRequestAuditLog(
                approval_request_id=approval_request.id,
                approved_by_id=database_user.id,
                approved_by_email=email,
                dq_mode=DQModeEnum(body.dq_mode),
            )
            primary_db.add(audit_log)
            await primary_db.flush()
            approval_request_log_id = audit_log.id

    # Write approval JSON to blob storage
    _persist_approval_to_storage(
        upload_id=upload_id,
        approved_change_ids=approved_change_ids,
        rejected_change_ids=rejected_change_ids,
        approval_request_log_id=approval_request_log_id,
        dq_run_id=dq_run.id,
        dq_mode=body.dq_mode,
        country_code=country_code,
        dataset_name=file_upload.dataset.lower(),
        email=email,
    )

    if approval_request:
        await primary_db.commit()

    return {"status": "processing", "dq_run_id": dq_run.id, "dq_mode": body.dq_mode}


@router.post(
    "/by-upload",
    response_model=list[ApprovalByUploadResponse],
)
async def get_approvals_by_upload_ids(
    payload: ApprovalFilterByUploadRequest,
    primary_db: AsyncSession = Depends(get_primary_db),
):
    query = select(ApprovalRequest).where(
        ApprovalRequest.upload_id.in_(payload.upload_ids)
    )

    result = await primary_db.scalars(query)
    rows = result.all()

    return [
        ApprovalByUploadResponse(
            id=row.id,
            country=row.country,
            dataset=row.dataset,
            upload_id=row.upload_id,
            enabled=row.enabled,
        )
        for row in rows
    ]


@router.post(
    "/approve",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Security(IsPrivileged())],
)
async def approve_dataset_without_merge(
    payload: ApproveDatasetRequest,
    user: User = Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
):
    existing = await primary_db.scalar(
        select(ApprovalRequest).where(ApprovalRequest.upload_id == payload.upload_id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already approved or in process")

    upload = await primary_db.scalar(
        select(FileUpload).where(FileUpload.id == payload.upload_id)
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Upload ID not found")

    approval = ApprovalRequest(
        upload_id=payload.upload_id,
        country=upload.country,
        dataset=upload.dataset,
        enabled=True,
        is_merge_processing=False,
        approved_by_id=user.claims["oid"],
        approved_by_email=(user.claims.get("emails") or [None])[0],
        dq_mode=DQModeEnum(payload.dq_mode),
    )

    primary_db.add(approval)
    await primary_db.commit()

    return {"status": "approved", "upload_id": payload.upload_id}


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_approved_rows(
    body: SubmitApprovalRequest,
    upload_id: str = Query(...),
    country_code: str = Query(...),
    user: User = Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
    db: Session = Depends(get_db),
):
    """
    Step 4: Data Quality Assessment.
    Triggers a DQ run on the specified rows and mode.
    """
    # Reuse the same logic as submit_upload_review but adapted for this route
    return await submit_upload_review(
        country_code=country_code,
        upload_id=upload_id,
        body=body,
        user=user,
        primary_db=primary_db,
        db=db,
    )


@router.post("/{subpath}")
async def get_approval_request(
    subpath: str,
    payload: Optional[ApprovalFilterByUploadRequest] = None,
    db: Session = Depends(get_db),
    primary_db: AsyncSession = Depends(get_primary_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    """
    Fetch approval request details for a subpath (e.g., table_schema/table_name).
    Supports filtering by upload_ids.
    """
    # This logic was in the old code, implementing it to support the UI's potential usage
    if len(splits := urllib.parse.unquote(subpath).split("/")) != 2:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    table_schema, table_name = splits
    country = coco.convert(table_name, to="name_short")

    # Extract dataset from schema name
    dataset = table_schema.replace("staging", "").replace("_", " ").title().strip()

    # Base query for changes
    # Note: We use the same logic as in the old code to fetch changes via Trino system tables
    # if the new staging table approach doesn't provide what's needed for this specific view.

    # For now, let's try to reuse the existing get_upload_rows logic if possible,
    # but subpath is schema/table, not country/upload_id.

    # Fallback to the old logic of querying delta_lake.system.table_changes
    # (Since this is specifically requested to be restored)

    data_cte = (
        select(
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
        .cte("changes")
    )

    max_version_query = select(func.max(column("_commit_version"))).select_from(
        data_cte
    )
    max_version = db.execute(max_version_query).scalar() or 1

    cdf_query = (
        select("*")
        .select_from(data_cte)
        .where(
            (column("_commit_version") == 1)
            if max_version == 1
            else (column("_commit_version") == 2)
            | (
                (column("_commit_version") > 2)
                & (column("_change_type") != "update_preimage")
            )
        )
    )

    if payload and payload.upload_ids:
        cdf_query = cdf_query.where(column("upload_id").in_(payload.upload_ids))

    total_count = db.execute(
        select(func.count()).select_from(cdf_query.alias("q"))
    ).scalar()

    cdf_results = (
        db.execute(
            cdf_query.order_by(column("school_id_giga"))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .mappings()
        .all()
    )

    return {
        "info": {
            "country": country,
            "dataset": dataset,
        },
        "total_count": total_count,
        "data": [dict(r) for r in cdf_results],
    }


@router.post(
    "/submit",
    status_code=status.HTTP_200_OK,
    dependencies=[Security(IsPrivileged())],
)
async def submit_approval_request(
    upload_id: str,
    user: User = Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
):
    """
    Step 5: Final submission of an approval request for master merge.
    This triggers a DQ run in 'master' mode.
    """
    approval = await primary_db.scalar(
        select(ApprovalRequest).where(ApprovalRequest.upload_id == upload_id)
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.is_merge_processing:
        # If it's already processing, we might want to allow re-submission if it failed
        pass

    # Find the latest assessment blob to re-submit in master mode
    dataset_name = approval.dataset.lower().replace("school ", "")
    country_iso3 = approval.country.upper()

    # We search in staging/approved-row-ids/ for the latest blob for this upload
    # Note: The path structure might vary, so we search by prefix or use the dq_run relation
    # For now, we'll try to find the most recent DQRun for this upload
    latest_dq_run = await primary_db.scalar(
        select(DQRun)
        .where(DQRun.upload_id == upload_id)
        .order_by(DQRun.created.desc())
        .limit(1)
    )

    if not latest_dq_run:
        raise HTTPException(
            status_code=400,
            detail="No previous DQ assessment found. Please run assessment first.",
        )

    # Re-upload the approved row IDs with master mode
    try:
        dataset_folder = f"school-{dataset_name}"
        container_client = storage_client.get_container_client(
            storage_client.container_name
        )
        blob_prefix = f"staging/approved-row-ids/{dataset_folder}/"
        blobs_list = list(container_client.list_blobs(name_starts_with=blob_prefix))

        # Find the specific blob for the latest dq run by checking metadata
        assessment_blob_name = None
        for blob_props in blobs_list:
            # We need to fetch metadata for each blob to find the one with matching dq_run_id
            b_client = container_client.get_blob_client(blob_props.name)
            props = b_client.get_blob_properties()
            if props.metadata.get("dq_run_id") == str(latest_dq_run.id):
                assessment_blob_name = blob_props.name
                break

        if not assessment_blob_name:
            raise HTTPException(
                status_code=404,
                detail="Assessment data for the latest DQ run not found",
            )

        blob_client = storage_client.get_blob_client(assessment_blob_name)
        approved_rows_json = blob_client.download_blob().readall()

        # Create a new DQRun for the master submission
        new_dq_run = DQRun(
            upload_id=upload_id,
            dq_mode=DQModeEnum.master,
            status="PENDING",
        )
        primary_db.add(new_dq_run)
        await primary_db.flush()

        timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
        new_filename = f"{country_iso3}_school-{dataset_name}_{timestamp}.json"
        new_path = f"staging/approved-row-ids/{dataset_folder}/{new_filename}"

        email = (user.claims.get("emails") or [None])[0]

        storage_client.get_blob_client(new_path).upload_blob(
            approved_rows_json,
            overwrite=True,
            metadata={
                "approver_email": email,
                "dq_mode": "master",
                "dq_run_id": str(new_dq_run.id),
                "upload_id": upload_id,
            },
        )

        approval.dq_mode = DQModeEnum.master
        approval.is_merge_processing = True
        await primary_db.commit()

        return {"status": "submitted", "dq_run_id": new_dq_run.id, "dq_mode": "master"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process submission: {str(e)}"
        ) from e


def _build_info(file_upload: FileUpload, country_code: str) -> ApprovalRequestInfo:
    return ApprovalRequestInfo(
        country=coco.convert(country_code.upper(), to="name_short"),
        country_iso3=country_code.upper(),
        dataset=file_upload.dataset,
        upload_id=file_upload.id,
        uploaded_at=file_upload.created,
        uploader_email=file_upload.uploader_email,
    )
