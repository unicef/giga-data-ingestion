import asyncio
import io
import json
import os
from datetime import UTC, date, datetime, time
from pathlib import Path
from typing import Annotated, Literal, Optional

import country_converter as coco
import magic
import orjson
import pandas as pd
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    Security,
    status,
)
from fastapi_azure_auth.user import User
from loguru import logger
from pydantic import Field
from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

from azure.core.exceptions import HttpResponseError
from azure.storage.blob import ContentSettings
from data_ingestion.constants import constants
from data_ingestion.db.primary import get_db
from data_ingestion.db.trino import get_db as get_trino_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.data_quality_checks import (
    get_data_quality_summary,
)
from data_ingestion.internal.roles import get_user_roles
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import (
    DQRun,
    FileUpload,
    User as DatabaseUser,
)
from data_ingestion.models.dq_run import DQModeEnum
from data_ingestion.models.file_upload import DQStatusEnum
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.core import PagedResponseSchema
from data_ingestion.schemas.upload import (
    DataQualityCheckLabel,
    FileUpload as FileUploadSchema,
    FileUploadRequest,
    UnstructuredFileUploadRequest,
    UploadImpactPreviewRequest,
    UploadImpactPreviewResponse,
    ValidateFuzzyRequest,
)
from data_ingestion.utils.data_quality import get_metadata_path
from data_ingestion.utils.fuzzy_matching import run_fuzzy_matching
from data_ingestion.utils.nocodb import (
    get_nocodb_table_id_from_name,
    get_nocodb_table_rows,
)
from data_ingestion.utils.upload_impact import (
    build_upload_impact_preview,
    get_school_id_file_column,
    normalize_school_id,
)

DQ_CHECK_LABELS_TABLE_NAME = "SchoolGeolocationMasterDQChecks"

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(azure_scheme)],
)


def _parse_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return True
    return str(value).strip().lower() in {"true", "1", "yes", "y"}


def _parse_sort_order(value) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_dq_table_column_name(value: str) -> tuple[str, str]:
    key = value.removeprefix("dq_")
    assertion, _, column_key = key.partition("-")
    return assertion, column_key


def _normalize_dq_check_label(row: dict) -> DataQualityCheckLabel | None:
    dq_table_column_name = row.get("DQ Table Column Name") or ""
    parsed_assertion, parsed_column_key = _parse_dq_table_column_name(
        dq_table_column_name
    )
    assertion = row.get("Assertion") or parsed_assertion

    if not assertion:
        return None

    active = _parse_bool(row.get("Active"))
    if not active:
        return None

    ui_error_description = (
        row.get("UI Error Description")
        or row.get("Human Readable Name")
        or assertion.replace("_", " ")
    )

    return DataQualityCheckLabel(
        assertion=assertion,
        column_key=row.get("Column Key") or parsed_column_key,
        ui_error_description=ui_error_description,
        dq_table_column_name=dq_table_column_name or None,
        dq_check_category=row.get("DQ Check Category"),
        column_checked=row.get("Column Checked"),
        human_readable_name=row.get("Human Readable Name"),
        active=active,
        sort_order=_parse_sort_order(row.get("Sort Order")),
    )


@router.get("/data_quality_check_labels", response_model=list[DataQualityCheckLabel])
async def list_data_quality_check_labels():
    table_id = get_nocodb_table_id_from_name(DQ_CHECK_LABELS_TABLE_NAME)
    rows = get_nocodb_table_rows(table_id)
    labels = [
        label for row in rows if (label := _normalize_dq_check_label(row)) is not None
    ]

    return sorted(
        labels,
        key=lambda label: (
            label.sort_order is None,
            label.sort_order or 0,
            label.assertion,
            label.column_key,
        ),
    )


@router.get("/basic_check/{dataset}")
async def list_basic_checks(
    dataset: str = "geolocation",
    source: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    path = ""

    is_completed_query = (
        select(FileUpload)
        .where(FileUpload.is_processed_in_staging == True)  # noqa: E712
        .where(FileUpload.dataset == dataset)
        .where(FileUpload.dq_status == DQStatusEnum.COMPLETED)
        .where(FileUpload.dq_report_path != None)  # noqa: E711
        .where(FileUpload.dq_full_path != None)  # noqa: E711
        .order_by(FileUpload.created.desc())
    )

    if dataset == "geolocation":
        result = await db.scalars(is_completed_query)
        file_upload = result.first()

        if file_upload is not None:
            path = file_upload.dq_report_path
        else:
            path = (
                "data-quality-results/school-geolocation/"
                "sample-data-check/geolocation.json"
            )

    if dataset == "coverage":
        if source not in ["fb", "itu"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Schema does not exist"
            )

        is_completed_coverage_query = is_completed_query.where(
            FileUpload.source == source
        )

        result = await db.scalars(is_completed_coverage_query)
        file_upload = result.first()

        if file_upload is not None:
            path = file_upload.dq_report_path
        else:
            path = (
                "data-quality-results/school-coverage/"
                f"sample-data-check/{source}.json"
            )

    blob = storage_client.get_blob_client(path)
    if not blob.exists():
        logger.error("DQ report summary still does not exist")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data Quality report not found in storage at path: {path}",
        )

    blob_data = blob.download_blob().readall()
    dq_report_summary = blob_data.decode("utf-8")
    dq_report_summary_dict: dict = json.loads(dq_report_summary)

    return dq_report_summary_dict


@router.get("/basic_check/{dataset}/download")
async def download_basic_check(
    dataset: str = "geolocation",
    source: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    path = ""

    is_completed_query = (
        select(FileUpload)
        .where(FileUpload.is_processed_in_staging == True)  # noqa: E712
        .where(FileUpload.dataset == dataset)
        .where(FileUpload.dq_status == DQStatusEnum.COMPLETED)
        .where(FileUpload.dq_report_path != None)  # noqa: E711
        .where(FileUpload.dq_full_path != None)  # noqa: E711
        .order_by(FileUpload.created.desc())
    )

    if dataset == "geolocation":
        result = await db.scalars(is_completed_query)
        file_upload = result.first()

        if file_upload is not None:
            path = file_upload.dq_report_path
        else:
            path = (
                "data-quality-results/school-geolocation/"
                "sample-data-check/geolocation.json"
            )

    if dataset == "coverage":
        if source not in ["fb", "itu"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Schema does not exist"
            )

        is_completed_coverage_query = is_completed_query.where(
            FileUpload.source == source
        )

        result = await db.scalars(is_completed_coverage_query)
        file_upload = result.first()

        if file_upload is not None:
            path = file_upload.dq_report_path
        else:
            path = (
                "data-quality-results/school-coverage/"
                f"sample-data-check/{source}.json"
            )

    blob = storage_client.get_blob_client(path)
    if not blob.exists():
        logger.error("DQ report summary still does not exist")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found",
        )

    blob_data = blob.download_blob().readall()
    dq_report_summary = blob_data.decode("utf-8")
    dq_report_summary_dict: dict = json.loads(dq_report_summary)

    dq_result_df = pd.DataFrame(
        {
            "column": [],
            "assertion": [],
            "description": [],
        }
    )

    all_checks = []
    for key, value in dq_report_summary_dict.items():
        if key == "summary":
            continue

        all_checks.extend(value)

    dq_result_df = pd.DataFrame(all_checks)
    dq_result_df = dq_result_df[["column", "assertion", "description"]]

    dq_result_df = dq_result_df.sort_values(by=["assertion", "column"])
    csv = dq_result_df.to_csv(index=False)
    return StreamingResponse(
        io.StringIO(csv),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=data_quality_checks.csv"},
    )


@router.get("", response_model=PagedResponseSchema[FileUploadSchema])
async def list_uploads(  # noqa: C901
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    db: AsyncSession = Depends(get_db),
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Field(ge=1, le=50)] = 10,
    source: str | None = None,
    dataset: str | None = None,
    uploader_email: str | None = None,
    country: str | None = None,
    dq_status: str | None = None,
    dq_mode: str | None = None,
    approval_status: str | None = None,
    created_from: date | None = None,
    created_to: date | None = None,
    id_search: Annotated[
        str,
        Query(min_length=1, max_length=24, pattern=r"^\w+$"),
    ] = None,
):
    query = select(FileUpload)
    if not is_privileged:
        query = query.where(
            FileUpload.uploader_email == user.claims.get("emails", ["NONE"])[0]
        )

    if id_search:
        query = query.where(func.starts_with(FileUpload.id, id_search))

    if source is not None:
        query = query.where(FileUpload.source == source)

    if dataset is not None:
        query = query.where(FileUpload.dataset == dataset)

    if uploader_email is not None:
        query = query.where(FileUpload.uploader_email == uploader_email)

    if country is not None:
        query = query.where(FileUpload.country == country)

    if dq_status is not None:
        query = query.where(FileUpload.dq_status == dq_status)

    if dq_mode is not None:
        # dq_mode is derived from the latest DQRun of each upload (see below).
        # Uploads without any DQRun are displayed as "master", so the "master"
        # filter must also include them.
        latest_dq_mode = (
            select(DQRun.dq_mode)
            .where(DQRun.upload_id == FileUpload.id)
            .order_by(DQRun.id.desc())
            .limit(1)
            .scalar_subquery()
        )
        if dq_mode == DQModeEnum.master.value:
            query = query.where(
                or_(latest_dq_mode == DQModeEnum.master, latest_dq_mode.is_(None))
            )
        else:
            query = query.where(latest_dq_mode == dq_mode)

    if approval_status is not None:
        query = query.where(FileUpload.approval_status == approval_status)

    if created_from is not None:
        query = query.where(
            FileUpload.created >= datetime.combine(created_from, time.min)
        )

    if created_to is not None:
        query = query.where(
            FileUpload.created <= datetime.combine(created_to, time.max)
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    items = await db.scalars(
        query.order_by(FileUpload.created.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    items_list = list(items)

    if items_list:
        upload_ids = [item.id for item in items_list]
        dq_runs_query = select(DQRun).where(DQRun.upload_id.in_(upload_ids))
        dq_runs = await db.scalars(dq_runs_query)
        latest_dq_mode_map = {}
        for run in dq_runs:
            existing_run = latest_dq_mode_map.get(run.upload_id)
            if not existing_run or run.id > existing_run.id:
                latest_dq_mode_map[run.upload_id] = run

        for item in items_list:
            run = latest_dq_mode_map.get(item.id)
            item.dq_mode = run.dq_mode.value if run else "master"

    return {
        "data": items_list,
        "page": page,
        "page_size": page_size,
        "total_count": total,
    }


@router.get("/{upload_id}", response_model=FileUploadSchema)
async def get_upload(
    upload_id: str,
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    db: AsyncSession = Depends(get_db),
):
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access details for this file.",
        )

    dq_mode = "master"
    if file_upload.metadata_json_path:
        try:
            blob_client = storage_client.get_blob_client(file_upload.metadata_json_path)
            if blob_client.exists():
                metadata_json = json.loads(blob_client.download_blob().readall())
                dq_mode = metadata_json.get("dq_mode", "master")
        except Exception as e:
            logger.error(f"Failed to fetch dq_mode from metadata: {e}")
    file_upload.dq_mode = dq_mode

    return file_upload


def _parse_spreadsheet(
    content: bytes, file_ext: str, dtype_overrides: dict
) -> pd.DataFrame:
    buf = io.BytesIO(content)
    if file_ext == ".csv":
        return pd.read_csv(buf, dtype=dtype_overrides)
    if file_ext == ".xlsx":
        return pd.read_excel(buf, dtype=dtype_overrides, engine="openpyxl")
    return pd.read_excel(buf, dtype=dtype_overrides, engine="xlrd")


def _silver_table(dataset: str, country_code: str) -> str:
    schema = dataset.lower().replace("school ", "")
    return f"delta_lake.school_{schema}_silver.{country_code.lower()}"


def _get_master_school_ids(dataset: str, country_code: str, db: Session) -> set[str]:
    table_name = _silver_table(dataset, country_code)
    try:
        rows = (
            db.execute(
                text(
                    f"SELECT school_id_govt FROM {table_name} "  # nosec B608
                    "WHERE school_id_govt IS NOT NULL"
                )
            )
            .mappings()
            .all()
        )
    except Exception as err:
        if "TABLE_NOT_FOUND" in str(err):
            return set()
        logger.error(f"Failed to fetch master school IDs from {table_name}: {err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to fetch master school IDs from Trino.",
        ) from err

    return {
        normalized
        for row in rows
        if (normalized := normalize_school_id(row["school_id_govt"])) is not None
    }


def _get_impact_preview_school_id_column(form: UploadImpactPreviewRequest) -> str:
    try:
        column_mapping = orjson.loads(form.column_to_schema_mapping)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid column_to_schema_mapping.",
        ) from err

    try:
        return get_school_id_file_column(column_mapping)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err


def _serialize_spreadsheet(df: pd.DataFrame, file_ext: str) -> bytes:
    buf = io.BytesIO()
    if file_ext == ".csv":
        df.to_csv(buf, index=False)
    else:
        df.to_excel(buf, index=False)
    result = buf.getvalue()
    buf.close()
    return result


def _build_column_replacements(corrections_mapping: list) -> dict[str, dict]:
    column_replacements: dict[str, dict] = {}
    for correction in corrections_mapping:
        col = correction.get("column_name")
        old_val = correction.get("value_found")
        new_val = correction.get("replace_with")
        if col is not None and old_val is not None and new_val is not None:
            column_replacements.setdefault(col, {})[str(old_val)] = str(new_val)
    return column_replacements


def apply_fuzzy_corrections(
    fuzzy_corrections_json: str, file_extension: str, upload_content: bytes
) -> bytes:
    try:
        corrections_mapping = orjson.loads(fuzzy_corrections_json)
        file_ext = file_extension.lower()
        if file_ext not in constants.SUPPORTED_SPREADSHEET_EXTENSIONS:
            return upload_content

        column_replacements = _build_column_replacements(corrections_mapping)
        if not column_replacements:
            return upload_content

        dtype_overrides = {col: str for col in column_replacements}
        df = _parse_spreadsheet(upload_content, file_ext, dtype_overrides)

        if not any(col in df.columns for col in column_replacements):
            return upload_content

        for col, replacements in column_replacements.items():
            if col in df.columns:
                df[col] = df[col].replace(replacements)

        return _serialize_spreadsheet(df, file_ext)
    except Exception as e:
        logger.error(f"Failed to apply fuzzy corrections: {e}")
    return upload_content


@router.post("", response_model=FileUploadSchema)
async def upload_file(
    response: Response,
    dataset: str,
    dq_mode: Optional[DQModeEnum] = Query(None),
    form: FileUploadRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    form.dq_mode = getattr(dq_mode, "value", None) or form.dq_mode or "master"

    file = form.file

    if not is_privileged:
        country_dataset = f"{form.country}-School {dataset.capitalize()}"
        roles = await get_user_roles(user, db)
        if country_dataset not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions on this dataset",
            )

    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {constants.UPLOAD_FILE_SIZE_LIMIT_MB} MB limit",
        )

    file_content = await file.read(4096)
    await file.seek(0)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    if file_type not in constants.VALID_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_extension not in constants.VALID_UPLOAD_TYPES[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match file type.",
        )

    country_code = coco.convert(form.country, to="ISO3")
    email = user.claims.get("emails")[0]
    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    upload_metadata = orjson.loads(form.metadata)

    file_upload = FileUpload(
        uploader_id=database_user.id,
        uploader_email=database_user.email,
        country=country_code,
        dataset=dataset,
        source=form.source,
        mode=upload_metadata.get("mode") or None,
        original_filename=file.filename,
        column_to_schema_mapping=orjson.loads(form.column_to_schema_mapping),
        column_license=orjson.loads(form.column_license),
        data_owner=upload_metadata.get("data_owner"),
    )

    db.add(file_upload)
    await db.commit()
    await db.refresh(file_upload)

    # compute ADLS path before commit
    metadata_file_path = get_metadata_path(file_upload.upload_path)
    file_upload.metadata_json_path = metadata_file_path

    db.add(file_upload)
    await db.commit()

    # Create initial DQRun record
    dq_run = DQRun(
        upload_id=file_upload.id,
        dq_mode=form.dq_mode,
        status="IN_PROGRESS",
    )
    db.add(dq_run)
    await db.commit()
    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            **{str(k): str(v) for k, v in upload_metadata.items()},
            "country": form.country,
            "uploader_email": email,
            "dq_mode": form.dq_mode,
        }

        if form.source is not None:
            metadata["source"] = form.source

        await file.seek(0)
        upload_content = await file.read()

        # Apply fuzzy corrections if provided
        if form.fuzzy_corrections:
            loop = asyncio.get_running_loop()
            upload_content = await loop.run_in_executor(
                None,
                apply_fuzzy_corrections,
                form.fuzzy_corrections,
                file_extension,
                upload_content,
            )

        client.upload_blob(
            upload_content,
            overwrite=True,
            content_settings=ContentSettings(content_type=file_type),
        )
        # Upload metadata sidecar JSON
        metadata_blob_client = storage_client.get_blob_client(
            file_upload.metadata_json_path
        )
        metadata_json_bytes = json.dumps(metadata, indent=2).encode()
        metadata_blob_client.upload_blob(metadata_json_bytes, overwrite=True)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == file_upload.id))
        await db.commit()
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == file_upload.id))
        await db.commit()
        raise err
    return file_upload


@router.post("/review", response_model=FileUploadSchema)
async def upload_file_for_review(
    response: Response,
    dataset: str,
    dq_mode: Optional[DQModeEnum] = Query(None),
    form: FileUploadRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    """
    Acts exactly like /api/upload, but accepts a dq_mode parameter
    to control whether checks compare against uploaded file only or master table.
    Default is 'uploaded' for review mode.
    """
    resolved_dq_mode = "uploaded"
    if dq_mode is not None:
        resolved_dq_mode = dq_mode.value
    elif form.dq_mode:
        resolved_dq_mode = form.dq_mode

    form.dq_mode = resolved_dq_mode
    return await upload_file(
        response=response,
        dataset=dataset,
        dq_mode=None,
        form=form,
        db=db,
        user=user,
        is_privileged=is_privileged,
    )


@router.post("/{upload_id}/dq-run", status_code=status.HTTP_201_CREATED)
async def trigger_dq_run(
    upload_id: str,
    dq_mode: DQModeEnum,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    """
    Trigger a manual Data Quality assessment (Step 4).
    Updates the blob metadata to signal the Dagster sensor to re-run checks
    with the specified mode (uploaded vs master).
    """
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to trigger DQ for this file.",
        )

    # Create DQRun record
    dq_run = DQRun(
        upload_id=file_upload.id,
        dq_mode=dq_mode,
        status="IN_PROGRESS",
    )
    db.add(dq_run)

    # Update blob metadata to trigger sensor
    # We update the 'dq_mode' in the metadata JSON
    try:
        blob_client = storage_client.get_blob_client(file_upload.metadata_json_path)
        if blob_client.exists():
            metadata_json = json.loads(blob_client.download_blob().readall())
            metadata_json["dq_mode"] = dq_mode.value
            # We also add a timestamp to force the sensor to see it as a "new" event if it watches for changes
            metadata_json["dq_triggered_at"] = datetime.now(UTC).isoformat()

            blob_client.upload_blob(
                json.dumps(metadata_json, indent=2).encode(), overwrite=True
            )

            # Also update the metadata on the raw upload file itself
            raw_blob_client = storage_client.get_blob_client(file_upload.upload_path)
            if raw_blob_client.exists():
                string_metadata = {str(k): str(v) for k, v in metadata_json.items()}
                raw_blob_client.set_blob_metadata(metadata=string_metadata)

            # Reset DQ status in DB to indicate it's re-processing
            file_upload.dq_status = DQStatusEnum.IN_PROGRESS
            await db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Metadata file not found in storage",
            )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        logger.error(f"Failed to trigger DQ run: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger DQ run: {str(e)}",
        ) from e

    return {"message": "DQ run triggered successfully", "dq_run_id": dq_run.id}


@router.post("/unstructured", status_code=status.HTTP_201_CREATED)
async def upload_unstructured(  # noqa: C901
    response: Response,
    user: User = Depends(azure_scheme),
    form: UnstructuredFileUploadRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    file = form.file

    if not is_privileged:
        roles = await get_user_roles(user, db)
        if not any(role.rsplit("-")[0] == form.country for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions on this dataset",
            )

    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {constants.UPLOAD_FILE_SIZE_LIMIT_MB} MB limit",
        )

    file_content = await file.read(
        8192
    )  # Increased from 2048 to handle large cell values like POLYGON data
    await file.seek(0)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    # For CSV files with large cell values, magic might detect as text/plain
    # If extension is .csv but detected as text/plain, treat as CSV
    if file_extension.lower() == ".csv" and file_type == "text/plain":
        file_type = "text/csv"

    if file_type not in constants.VALID_UNSTRUCTURED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type.",
        )

    if file_extension not in constants.VALID_UNSTRUCTURED_UPLOAD_TYPES[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match file type.",
        )

    country_code = coco.convert(form.country, to="ISO3")
    if country_code == "not found":
        country_code = "N/A"

    email = user.claims.get("emails")[0]
    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    upload_metadata = orjson.loads(form.metadata)
    file_upload = FileUpload(
        uploader_id=database_user.id,
        uploader_email=database_user.email,
        country=country_code,
        dataset="unstructured",
        mode=upload_metadata.get("mode") or None,
        original_filename=file.filename,
        column_to_schema_mapping={},
        column_license={},
        dq_status=DQStatusEnum.SKIPPED,
        data_owner=upload_metadata.get("data_owner"),
    )
    db.add(file_upload)
    await db.commit()
    await db.refresh(file_upload)

    # Keep parity with school uploads: persist a sidecar JSON metadata path.
    metadata_file_path = get_metadata_path(file_upload.upload_path)
    file_upload.metadata_json_path = metadata_file_path
    db.add(file_upload)
    await db.commit()

    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            **{str(k): str(v) for k, v in upload_metadata.items()},
            "country": form.country,
            "uploader_email": email,
        }

        if form.source is not None:
            metadata["source"] = form.source

        await file.seek(0)
        client.upload_blob(
            await file.read(),
            metadata=metadata,
            content_settings=ContentSettings(content_type=file_type),
        )
        metadata_blob_client = storage_client.get_blob_client(
            file_upload.metadata_json_path
        )
        metadata_json_bytes = json.dumps(metadata, indent=2).encode()
        metadata_blob_client.upload_blob(metadata_json_bytes, overwrite=True)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        raise err


@router.post("/structured", status_code=status.HTTP_201_CREATED)
async def upload_structured(  # noqa: C901
    response: Response,
    user: User = Depends(azure_scheme),
    form: UnstructuredFileUploadRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    file = form.file

    # For structured datasets, we don't validate country permissions since they're global
    # Only check if user is privileged or has any upload permissions
    if not is_privileged:
        roles = await get_user_roles(user, db)
        if not roles:  # If user has no roles at all, deny access
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions to upload structured datasets",
            )

    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {constants.UPLOAD_FILE_SIZE_LIMIT_MB} MB limit",
        )

    file_content = await file.read(
        8192
    )  # Increased from 2048 to handle large cell values like POLYGON data
    await file.seek(0)
    file_type = magic.from_buffer(file_content, mime=True)
    file_extension = os.path.splitext(file.filename)[1]

    # For CSV files with large cell values, magic might detect as text/plain
    # If extension is .csv but detected as text/plain, treat as CSV
    if file_extension.lower() == ".csv" and file_type == "text/plain":
        file_type = "text/csv"

    # For structured datasets, we only accept CSV files
    if file_type != "text/csv" and file_type != "application/csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Structured datasets only accept CSV files.",
        )

    if file_extension != ".csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension must be .csv for structured datasets.",
        )

    portal_ds = (form.portal_dataset or "").strip().lower()
    if portal_ds == "health":
        dataset_label = "health"
    elif portal_ds == "":
        dataset_label = "structured"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portal_dataset value.",
        )

    # For structured datasets, always use "N/A" as country
    if form.country == "Global Dataset":
        country_code = "N/A"
    else:
        country_code = coco.convert(form.country, to="ISO3")
        if country_code == "not found":
            country_code = "N/A"

    email = user.claims.get("emails")[0]
    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )

    upload_metadata = orjson.loads(form.metadata)
    file_upload = FileUpload(
        uploader_id=database_user.id,
        uploader_email=database_user.email,
        country=country_code,
        dataset=dataset_label,
        mode=upload_metadata.get("mode") or None,
        original_filename=file.filename,
        column_to_schema_mapping={},
        column_license={},
        dq_status=DQStatusEnum.SKIPPED,
        data_owner=upload_metadata.get("data_owner"),
    )
    db.add(file_upload)
    await db.commit()
    await db.refresh(file_upload)

    metadata_file_path = get_metadata_path(file_upload.upload_path)
    file_upload.metadata_json_path = metadata_file_path
    db.add(file_upload)
    await db.commit()

    client = storage_client.get_blob_client(file_upload.upload_path)

    try:
        metadata = {
            **{str(k): str(v) for k, v in upload_metadata.items()},
            "country": form.country,
            "uploader_email": email,
            "dataset_type": dataset_label,
        }

        if form.source is not None:
            metadata["source"] = form.source

        await file.seek(0)
        client.upload_blob(
            await file.read(),
            metadata=metadata,
            content_settings=ContentSettings(content_type=file_type),
        )
        metadata_blob_client = storage_client.get_blob_client(
            file_upload.metadata_json_path
        )
        metadata_json_bytes = json.dumps(metadata, indent=2).encode()
        metadata_blob_client.upload_blob(metadata_json_bytes, overwrite=True)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        raise err


@router.get(
    "/data_quality_check/{upload_id}",
)
async def get_data_quality_check(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access details for this file.",
        )

    if file_upload.dq_status != DQStatusEnum.COMPLETED:
        return {"dq_summary": None, "status": file_upload.dq_status}

    dq_report_summary_dict = get_data_quality_summary(file_upload.dq_report_path)

    return {"dq_summary": dq_report_summary_dict, "status": file_upload.dq_status}


@router.get(
    "/data_quality_check/{upload_id}/download",
)
async def download_data_quality_check(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if not is_privileged:
        if file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access details for this file.",
            )

    path = Path(file_upload.dq_full_path)
    dataset = path.parts[1]
    country_code = path.parts[3]
    upload_filename = path.name

    download_path_human_readable = f"data-quality-results/{dataset}/dq-human-readable-descriptions/{country_code}/{upload_filename}"
    blob = storage_client.get_blob_client(download_path_human_readable)

    if not blob.exists():
        download_path_original_dq = f"data-quality-results/{dataset}/dq-overall/{country_code}/{upload_filename}"
        blob = storage_client.get_blob_client(download_path_original_dq)

    stream = blob.download_blob()
    headers = {"Content-Disposition": f"attachment; filename={upload_filename}"}

    return StreamingResponse(
        stream.chunks(),
        media_type="application/octet-stream",
        headers=headers,
    )


@router.get("/failed_rows/{dataset}/{country_code}/{filename}")
async def download_failed_rows_direct(
    dataset: str,
    country_code: str,
    filename: str,
):
    filename = str(Path(filename).with_suffix(".csv"))

    path = f"data-quality-results/{dataset}/dq-failed-rows-human-readable/{country_code}/{filename}"
    blob = storage_client.get_blob_client(path)

    if not blob.exists():
        logger.error(f"File not found at path: {path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed rows file not found at path: {path}",
        )

    try:
        stream = blob.download_blob()
        return StreamingResponse(
            stream.chunks(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error downloading blob: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading file: {str(e)}",
        ) from e


@router.get("/passed_rows/{dataset}/{country_code}/{filename}")
async def download_passed_rows_direct(
    dataset: str,
    country_code: str,
    filename: str,
):
    filename = str(Path(filename).with_suffix(".csv"))

    path = f"data-quality-results/{dataset}/dq-passed-rows-human-readable/{country_code}/{filename}"

    blob = storage_client.get_blob_client(path)

    if not blob.exists():
        logger.error(f"File not found at path: {path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Passed rows file not found at path: {path}",
        )

    try:
        stream = blob.download_blob()
        return StreamingResponse(
            stream.chunks(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error downloading blob: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading file: {str(e)}",
        ) from e


@router.get("/dq_summary/{dataset}/{country_code}/{filename}")
async def download_dq_summary_direct(
    dataset: str,
    country_code: str,
    filename: str,
):
    logger.info(
        f"Downloading dq-summary: dataset={dataset}, country={country_code}, file={filename}"
    )
    if not filename.endswith(".txt"):
        filename = filename.split(".")[0] + ".txt"
    # Build path to the .txt file only
    path = f"data-quality-results/{dataset}/dq-report/{country_code}/{filename}"
    logger.info(f"Attempting to download from path: {path}")

    blob = storage_client.get_blob_client(path)

    if not blob.exists():
        logger.error(f"File not found at path: {path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DQ summary file not found at path: {path}",
        )

    try:
        stream = blob.download_blob()
        return StreamingResponse(
            stream.chunks(),
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error downloading blob: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading file: {str(e)}",
        ) from e


@router.get("/raw_file/{dataset}/{country_code}/{filename}")
async def download_raw_file_direct(
    dataset: str,
    country_code: str,
    filename: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    """Download the raw uploaded file from blob storage."""
    # Build the path to the raw file
    path = f"raw/uploads/school-{dataset}/{country_code}/{filename}"
    logger.info(f"Attempting to download raw file from path: {path}")

    blob = storage_client.get_blob_client(path)

    if not blob.exists():
        logger.error(f"Raw file not found at path: {path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Raw file not found",
        )

    try:
        stream = blob.download_blob()
        # Get the content type from blob properties or default to octet-stream
        content_type = (
            blob.get_blob_properties().content_settings.content_type
            or "application/octet-stream"
        )

        return StreamingResponse(
            stream.chunks(),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error downloading raw file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading file: {str(e)}",
        ) from e


@router.post(
    "/impact-preview",
    response_model=UploadImpactPreviewResponse,
    status_code=status.HTTP_200_OK,
)
async def get_upload_impact_preview(
    dataset: str,
    form: UploadImpactPreviewRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    trino: Session = Depends(get_trino_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    """
    Compare uploaded school IDs against the current country master dataset.

    Counts are row-based: duplicate IDs in the uploaded file count once per row,
    matching how users review uploaded school rows in the UI.
    """
    if dataset not in {"geolocation", "coverage"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impact preview is only supported for school data uploads.",
        )

    if not is_privileged:
        country_dataset = f"{form.country}-School {dataset.capitalize()}"
        roles = await get_user_roles(user, db)
        if country_dataset not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions on this dataset",
            )

    file = form.file
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {constants.UPLOAD_FILE_SIZE_LIMIT_MB} MB limit",
        )

    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in constants.SUPPORTED_SPREADSHEET_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impact preview currently only supports {', '.join(constants.SUPPORTED_SPREADSHEET_EXTENSIONS)} files.",
        )

    school_id_file_column = _get_impact_preview_school_id_column(form)

    await file.seek(0)
    try:
        content = await file.read()
        df = _parse_spreadsheet(content, file_extension, {school_id_file_column: str})
    except Exception as err:
        logger.error(f"Failed to parse file for impact preview: {err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {file_extension} format.",
        ) from err

    if school_id_file_column not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mapped school_id_govt column '{school_id_file_column}' was not found in the file.",
        )

    country_code = coco.convert(form.country, to="ISO3")
    if country_code == "not found":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Country could not be resolved to an ISO3 code.",
        )

    file_school_ids = [
        normalized_id
        for value in df[school_id_file_column].tolist()
        if (normalized_id := normalize_school_id(value)) is not None
    ]

    master_school_ids = _get_master_school_ids(dataset, country_code, trino)
    return build_upload_impact_preview(
        file_school_ids=file_school_ids,
        total_rows=len(df.index),
        master_school_ids=master_school_ids,
    )


VALID_SORT_COLUMNS = {
    "giga_sync_file_id",
    "giga_sync_file_name",
    "dataset_type",
    "country_code",
    "created_at",
    "max(created_at)",
}

VALID_SORT_ORDERS = {"ASC", "DESC"}


@router.get("/rejected_rows", response_model=PagedResponseSchema)
async def list_rejected_uploads(
    page: int = 1,
    page_size: int = 10,
    sort_by: Literal[
        "filename", "upload_id", "dataset", "country", "created_at"
    ] = "created_at",
    sort_order: Literal["asc", "desc"] = "desc",
    search: Optional[str] = None,
    country_code: Optional[str] = None,
    dataset_type: Optional[str] = None,
    trino: Session = Depends(get_trino_db),
    is_privileged: bool = Depends(IsPrivileged.raises(True)),
):
    """
    List all uploads that have rejected rows in the aggregated error table.
    Supports pagination, sorting, and filtering.
    Restricted to privileged users.
    """
    try:
        sort_map = {
            "filename": "giga_sync_file_name",
            "upload_id": "giga_sync_file_id",
            "dataset": "dataset_type",
            "country": "country_code",
            "created_at": "max(created_at)",
        }

        sort_col = sort_map.get(sort_by, "max(created_at)")

        if sort_col not in VALID_SORT_COLUMNS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort column: {sort_by}",
            )

        if sort_order.upper() not in VALID_SORT_ORDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sort order. Must be asc or desc",
            )

        conditions = []
        params = {"limit": page_size, "offset": (page - 1) * page_size}

        if search:
            conditions.append(
                "(giga_sync_file_name LIKE :search OR giga_sync_file_id LIKE :search)"
            )
            params["search"] = f"%{search}%"

        if country_code:
            conditions.append("country_code = :country_code")
            params["country_code"] = country_code

        if dataset_type:
            conditions.append("dataset_type = :dataset_type")
            params["dataset_type"] = dataset_type

        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

        # nosec B608: where_clause is built from parameterized conditions, sort_col is validated
        count_query = f"""
            SELECT COUNT(DISTINCT giga_sync_file_id)
            FROM school_master.upload_errors
            {where_clause}
        """  # nosec B608
        total_count = trino.execute(text(count_query), params).scalar()

        # We need to group by to get distinct uploads, but we also want sorting.
        # If sorting by metadata that is constant per file_id (filename, country, dataset), distinct is fine.
        # If sorting by created_at, we need aggregation.
        # The safest "List Uploads" query from an error table is grouping by file_id.

        # nosec B608: where_clause uses parameterized queries, sort_col and sort_order are validated
        sql_query = f"""
            SELECT
                giga_sync_file_id,
                max(giga_sync_file_name) as giga_sync_file_name,
                max(dataset_type) as dataset_type,
                max(country_code) as country_code,
                max(created_at) as created_at
            FROM school_master.upload_errors
            {where_clause}
            GROUP BY giga_sync_file_id
            ORDER BY {sort_col} {sort_order.upper()}
            LIMIT :limit OFFSET :offset
        """  # nosec B608

        result = trino.execute(text(sql_query), params)
        rows = result.fetchall()

        items = [
            {
                "upload_id": row.giga_sync_file_id,
                "filename": row.giga_sync_file_name,
                "dataset": row.dataset_type,
                "country": row.country_code,
                "created_at": str(row.created_at),
            }
            for row in rows
        ]

        return {
            "data": items,
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
        }

    except Exception as e:
        logger.error(f"Error listing rejected uploads: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing rejected uploads: {str(e)}",
        ) from e


@router.get("/errors", response_model=PagedResponseSchema)
async def query_errors(
    page: int = 1,
    page_size: int = 10,
    sort_by: Literal["created_at", "filename", "upload_id"] = "created_at",
    sort_order: Literal["asc", "desc"] = "desc",
    country_code: Optional[str] = None,
    dataset_type: Optional[str] = None,
    upload_id: Optional[str] = None,
    trino: Session = Depends(get_trino_db),
    is_privileged: bool = Depends(IsPrivileged.raises(True)),
):
    """
    Query errors from the aggregated error table with filters.
    Returns a paginated list of error records with parsed details.
    Restricted to privileged users.
    """
    try:
        # Sort mapping
        sort_map = {
            "filename": "giga_sync_file_name",
            "upload_id": "giga_sync_file_id",
            "created_at": "created_at",
        }
        sort_col = sort_map.get(sort_by, "created_at")

        if sort_col not in VALID_SORT_COLUMNS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort column: {sort_by}",
            )

        if sort_order.upper() not in VALID_SORT_ORDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sort order. Must be asc or desc",
            )

        conditions = []
        params = {"limit": page_size, "offset": (page - 1) * page_size}

        if country_code:
            conditions.append("country_code = :country_code")
            params["country_code"] = country_code

        if dataset_type:
            conditions.append("dataset_type = :dataset_type")
            params["dataset_type"] = dataset_type

        if upload_id:
            conditions.append("giga_sync_file_id = :upload_id")
            params["upload_id"] = upload_id

        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

        # nosec B608: where_clause is built from parameterized conditions
        count_query = f"""
            SELECT COUNT(*)
            FROM school_master.upload_errors
            {where_clause}
        """  # nosec B608
        total_count = trino.execute(text(count_query), params).scalar()

        # nosec B608: where_clause uses parameterized queries, sort_col and sort_order are validated
        sql_query = f"""
            SELECT giga_sync_file_id, giga_sync_file_name, dataset_type, country_code, row_data, error_details, created_at
            FROM school_master.upload_errors
            {where_clause}
            ORDER BY {sort_col} {sort_order.upper()}
            LIMIT :limit OFFSET :offset
        """  # nosec B608

        result = trino.execute(text(sql_query), params)
        rows = result.fetchall()

        output = []
        for row in rows:
            record = {
                "upload_id": row.giga_sync_file_id,
                "filename": row.giga_sync_file_name,
                "dataset": row.dataset_type,
                "country": row.country_code,
                "created_at": str(row.created_at),
                "row_data": json.loads(row.row_data) if row.row_data else {},
                "error_details": json.loads(row.error_details)
                if row.error_details
                else {},
            }
            output.append(record)

        return {
            "data": output,
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
        }

    except Exception as e:
        logger.error(f"Error querying errors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying errors: {str(e)}",
        ) from e


@router.get("/{upload_id}/rejected_rows/download")
async def download_rejected_rows(
    upload_id: str,
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    db: AsyncSession = Depends(get_db),
    trino: Session = Depends(get_trino_db),
):
    """
    Download rejected rows for a specific upload from the aggregated error table.
    Queries the school_master.upload_errors Delta table via Trino.
    Parses/Flattens the JSON columns (row_data, error_details) into a CSV.
    """
    query = select(FileUpload).where(FileUpload.id == upload_id)
    file_upload = await db.scalar(query)

    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access details for this file.",
        )

    try:
        req_query = text(
            "SELECT row_data, error_details FROM school_master.upload_errors WHERE giga_sync_file_id = :upload_id"
        )
        result = trino.execute(req_query, {"upload_id": upload_id})
        rows = result.fetchall()

        parsed_rows = []
        for row in rows:
            row_dict = {}
            if row.row_data:
                try:
                    row_dict.update(json.loads(row.row_data))
                except json.JSONDecodeError:
                    row_dict["row_data_raw"] = row.row_data

            if row.error_details:
                try:
                    row_dict.update(json.loads(row.error_details))
                except json.JSONDecodeError:
                    row_dict["error_details_raw"] = row.error_details

            parsed_rows.append(row_dict)

        if not parsed_rows:
            df = pd.DataFrame()
        else:
            df = pd.DataFrame(parsed_rows)

        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        filename = f"rejected_rows_{upload_id}.csv"

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except Exception as e:
        logger.error(f"Error querying rejected rows from Trino: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving rejected rows: {str(e)}",
        ) from e


@router.post("/validate-fuzzy", status_code=status.HTTP_200_OK)
async def validate_fuzzy_matching(
    dataset: str,
    form: ValidateFuzzyRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(azure_scheme),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
):
    """
    Synchronously validate an uploaded CSV file for fuzzy matching errors.
    Returns the errors grouped by column to display in the UI.
    """
    if not is_privileged:
        roles = await get_user_roles(user, db)
        if not roles:  # If user has no roles at all, deny access
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have permissions to upload structured datasets",
            )
    file = form.file

    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )

    await file.read(8192)
    await file.seek(0)
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in constants.SUPPORTED_SPREADSHEET_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fuzzy validation currently only supports {', '.join(constants.SUPPORTED_SPREADSHEET_EXTENSIONS)} files.",
        )

    # Re-read the file to parse with pandas
    await file.seek(0)
    try:
        if file_extension == ".csv":
            df = pd.read_csv(file.file)
        elif file_extension == ".xlsx":
            df = pd.read_excel(file.file, engine="openpyxl")
        else:
            df = pd.read_excel(file.file, engine="xlrd")
    except Exception as e:
        logger.error(f"Failed to parse file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {file_extension} format.",
        ) from e

    try:
        column_mapping = orjson.loads(form.column_to_schema_mapping)
        results = run_fuzzy_matching(df, column_mapping)
        return results

    except Exception as e:
        logger.error(f"Error during fuzzy matching validation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running fuzzy matching validation: {str(e)}",
        ) from e


@router.head("/dq_kit/{upload_id}/download")
@router.get("/dq_kit/{upload_id}/download")
async def download_dq_kit(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    """Download a complete DQ Kit ZIP for a given upload."""
    from data_ingestion.utils.dq_kit_generator import generate_dq_kit_zip

    file_upload = await db.scalar(select(FileUpload).where(FileUpload.id == upload_id))
    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file.",
        )

    if file_upload.dq_status != DQStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DQ Kit is not available. DQ Status: {file_upload.dq_status.value}",
        )

    try:
        logger.info(f"Generating DQ Kit for upload_id: {upload_id}")
        zip_buffer, filename = generate_dq_kit_zip(file_upload)

        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error generating DQ Kit: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating DQ Kit: {str(e)}",
        ) from e


@router.get("/map/{upload_id}")
async def get_school_map(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    is_privileged: bool = Depends(IsPrivileged.raises(False)),
    user: User = Depends(azure_scheme),
):
    """Serve the interactive school-location HTML map for a given upload."""
    from data_ingestion.utils.dq_kit_generator import get_map_blob_path

    file_upload = await db.scalar(select(FileUpload).where(FileUpload.id == upload_id))
    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if (
        not is_privileged
        and file_upload.uploader_email != user.claims.get("emails", ["NONE"])[0]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file.",
        )

    map_path = get_map_blob_path(file_upload)
    map_filename = Path(map_path).name
    logger.info(f"Attempting to serve map from: {map_path}")

    blob = storage_client.get_blob_client(map_path)
    if not blob.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Map not found. It may not have been generated yet.",
        )

    try:
        stream = blob.download_blob()
        return StreamingResponse(
            stream.chunks(),
            media_type="text/html",
            headers={
                "Content-Disposition": f"inline; filename={map_filename}",
                "X-Frame-Options": "SAMEORIGIN",
            },
        )
    except Exception as e:
        logger.error(f"Error serving map: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading map: {str(e)}",
        ) from e
