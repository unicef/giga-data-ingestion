import json
from datetime import UTC, datetime

import country_converter as coco
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi_azure_auth.user import User
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

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
    ApprovalRequestListing,
    ApproveDatasetRequest,
    UploadApprovedRowsRequest,
from data_ingestion.models.approval_requests import ApprovalRequestAuditLog
from data_ingestion.models.file_upload import FileUpload
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.approval_requests import (
    ApprovalRequestInfo,
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
    rows = (
        db.execute(
            text(
                f"SELECT school_id_giga, change_type FROM {staging} "  # nosec B608
                f"WHERE upload_id = '{upload_id}' "
                f"AND school_id_giga IN {_in_clause(rows_input)}"
            )
        )
        .mappings()
        .all()
    )
    id_to_change_type = {r["school_id_giga"]: r["change_type"] for r in rows}
    return [
        f"{sid}|{upload_id}|{id_to_change_type[sid]}"
        for sid in rows_input
        if sid in id_to_change_type
    ]


@router.post("/{country_code}/{upload_id}/submit", status_code=status.HTTP_200_OK)
async def submit_upload_review(
    country_code: str,
    upload_id: str,
    body: SubmitApprovalRequest,
    user: User = Depends(azure_scheme),
    primary_db: AsyncSession = Depends(get_primary_db),
    db: Session = Depends(get_db),
):
    posix_path = Path(urllib.parse.unquote(body.subpath))
    dataset = posix_path.parent.name.replace("_staging", "").replace("_", "-")
    country_iso3 = posix_path.name.split("_")[0].upper()
    timestamp = datetime.now().strftime(constants.FILENAME_TIMESTAMP_FORMAT)
    approval = await primary_db.scalar(
        select(ApprovalRequest).where(
            (ApprovalRequest.country == country_iso3)
            & (ApprovalRequest.dataset == dataset)
            & (ApprovalRequest.enabled.is_(True))
        )
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active approval request not found",
        )
    filename = f"{country_iso3}_{dataset}_{timestamp}.json"
    dq_run = DQRun(
        upload_id=approval.upload_id,
        dq_mode=DQModeEnum.master,
        status="PENDING",
    )

    primary_db.add(dq_run)
    await primary_db.commit()
    await primary_db.refresh(dq_run)
    approve_location = (
        f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}/approved-row-ids/"
        f"{dq_run.id}/{filename}"
    )
    email = user.claims.get("emails")[0]
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

    approve_client = storage_client.get_blob_client(approve_location)
    try:
        approve_client.upload_blob(
            json.dumps(body.approved_rows),
            overwrite=True,
            metadata={
                "approver_email": email,
                "dq_mode": body.dq_mode,
                "dq_run_id": str(dq_run.id),
                "upload_id": str(body.upload_id),
            },
            content_settings=ContentSettings(content_type="application/json"),
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
    # change_id format: school_id_giga|upload_id|change_type (matches Dagster staging step)
    approved_change_ids = _resolve_change_ids(
        body.approved_rows, staging, upload_id, db
    )
    rejected_change_ids = _resolve_change_ids(
        body.rejected_rows, staging, upload_id, db
    )

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
                    ApprovalRequest.dq_mode: body.dq_mode,
                }
            )
            .returning(column("id"))
        )
        primary_db.add(
            ApprovalRequestAuditLog(
                approval_request_id=obj.first().id,
                approved_by_id=database_user.id,
                approved_by_email=database_user.email,
                dq_mode=DQModeEnum(body.dq_mode),
    # Create the audit log first so its ID can be included in the approval payload.
    approval_request_log_id = None
    if approval_request:
        approval_request.is_merge_processing = True
        if approved_change_ids and database_user:
            audit_log = ApprovalRequestAuditLog(
                approval_request_id=approval_request.id,
                approved_by_id=database_user.id,
                approved_by_email=email,
            )
            primary_db.add(audit_log)
            await primary_db.flush()
            approval_request_log_id = audit_log.id

    # Write approval JSON to blob storage.
    # Dagster sensor watches this path and triggers the silver merge job.
    # Filename must follow the format expected by deconstruct_school_master_filename_components:
    # {COUNTRY_CODE}_{domain}-{dataset_type}_{timestamp}.json  (3 underscore-separated parts)
    dataset_name = file_upload.dataset.lower()
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    approval_filename = f"{country_code.upper()}_school-{dataset_name}_{timestamp}.json"
    approval_path = (
        f"staging/approved-row-ids/school-{dataset_name}"
        f"/{country_code.upper()}/{approval_filename}"
    )
    approval_payload = json.dumps(
        {
            "upload_id": upload_id,
            "approved_change_ids": approved_change_ids,
            "rejected_change_ids": rejected_change_ids,
            "approval_request_log_id": approval_request_log_id,
        },
        indent=2,
    ).encode()
    storage_client.get_blob_client(approval_path).upload_blob(
        approval_payload, overwrite=True
    )

    if approval_request:
        await primary_db.commit()

    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err


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
        approved_by_email=user.claims["emails"][0],
        dq_mode=payload.dq_mode,
    )

    primary_db.add(approval)
    await primary_db.commit()

    return {"status": "approved", "upload_id": payload.upload_id}


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
    approval = await primary_db.scalar(
        select(ApprovalRequest).where(ApprovalRequest.upload_id == upload_id)
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.is_merge_processing:
        raise HTTPException(status_code=400, detail="Already submitted for merge")

    # Re-upload approved row IDs with master mode to trigger DQ re-run
    try:
        # Find the latest approved row IDs blob for this approval request
        dataset = approval.dataset.replace(" ", "-").lower()
        country_iso3 = approval.country

        # List blobs in the approved-row-ids directory for this dataset/country
        blob_prefix = f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}/approved-row-ids/{dataset}/{country_iso3}/"
        container_client = storage_client.get_container_client(
            storage_client.container_name
        )

        # Get the most recent blob
        blobs = list(container_client.list_blobs(name_starts_with=blob_prefix))
        if not blobs:
            raise HTTPException(
                status_code=400,
                detail="No approved rows found. Please approve rows before submitting.",
            )

        # Sort by last_modified to get the most recent
        latest_blob = max(blobs, key=lambda b: b.last_modified)

        # Download the existing approved row IDs
        blob_client = storage_client.get_blob_client(latest_blob.name)
        approved_rows_json = blob_client.download_blob().readall()

        # Get the approver email from the blob metadata
        blob_properties = blob_client.get_blob_properties()
        approver_email = blob_properties.metadata.get(
            "approver_email", user.claims.get("emails", [""])[0]
        )

        # Create new blob with master mode
        timestamp = datetime.now().strftime(constants.FILENAME_TIMESTAMP_FORMAT)
        filename = f"{country_iso3}_{dataset}_{timestamp}.json"
        new_approve_location = f"{constants.APPROVAL_REQUESTS_RESULT_UPLOAD_PATH}/approved-row-ids/{dataset}/{country_iso3}/{filename}"

        new_approve_client = storage_client.get_blob_client(new_approve_location)
        new_approve_client.upload_blob(
            approved_rows_json,
            overwrite=True,
            metadata={"approver_email": approver_email, "dq_mode": "master"},
            content_settings=ContentSettings(content_type="application/json"),
        )

        # Update the approval request with master mode
        approval.dq_mode = DQModeEnum.master
        approval.is_merge_processing = True
        await primary_db.commit()

        return {"status": "submitted", "dq_mode": "master"}

    except HttpResponseError as err:
        raise HTTPException(
            detail=f"Failed to re-upload approved rows: {err.message}",
            status_code=err.response.status_code,
        ) from err
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
