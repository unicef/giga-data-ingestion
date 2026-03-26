import io

from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Security,
    status,
)
from sqlalchemy import column, func, literal, select, text
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

router = APIRouter(
    prefix="/api/error-table",
    tags=["error-table"],
    dependencies=[Security(azure_scheme)],
)

UPLOAD_ERRORS_TABLE = "school_master.upload_errors"


def _serialize_error_row(row: dict) -> dict:
    """Serialize a single error row from the upload_errors table."""
    return {
        "giga_sync_file_id": row.get("giga_sync_file_id"),
        "giga_sync_file_name": row.get("giga_sync_file_name"),
        "dataset_type": row.get("dataset_type"),
        "country_code": row.get("country_code"),
        # Mandatory columns (flat, queryable)
        "school_id_govt": row.get("school_id_govt"),
        "school_id_giga": row.get("school_id_giga"),
        "school_name": row.get("school_name"),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "education_level": row.get("education_level"),
        # Failure reason
        "failure_reason": row.get("failure_reason"),
        # JSON fields
        "additional_data": row.get("additional_data"),
        "error_details": row.get("error_details"),
        "created_at": (
            row["created_at"].isoformat() if row.get("created_at") else None
        ),
    }


@router.get("")
def list_upload_errors(
    country_code: str | None = Query(default=None),
    dataset_type: str | None = Query(default=None),
    file_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List rows from the unified upload errors table with optional filters."""
    try:
        db.execute(
            select("*")
            .select_from(text("information_schema.tables"))
            .where(
                (column("table_schema") == literal("school_master"))
                & (column("table_name") == literal("upload_errors"))
            )
            .limit(1)
        ).first()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload errors table does not exist.",
        ) from e

    base = select("*").select_from(text(UPLOAD_ERRORS_TABLE))

    filters = []
    if country_code:
        filters.append(column("country_code") == literal(country_code))
    if dataset_type:
        filters.append(column("dataset_type") == literal(dataset_type))
    if file_id:
        filters.append(column("giga_sync_file_id") == literal(file_id))

    filtered = base.where(*filters) if filters else base

    total_count = db.execute(
        select(func.count()).select_from(filtered.subquery())
    ).scalar()

    rows = (
        db.execute(
            filtered.order_by(column("created_at").desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .mappings()
        .all()
    )

    data = [_serialize_error_row(row) for row in rows]

    return {
        "data": data,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
    }


@router.get("/summary")
def get_upload_errors_summary(
    db: Session = Depends(get_db),
):
    """Aggregated error counts grouped by country_code and dataset_type."""
    try:
        summary_query = (
            select(
                column("country_code"),
                column("dataset_type"),
                func.count().label("error_count"),
                func.count(column("giga_sync_file_id").distinct()).label(
                    "distinct_files"
                ),
            )
            .select_from(text(UPLOAD_ERRORS_TABLE))
            .group_by(column("country_code"), column("dataset_type"))
            .order_by(column("country_code"), column("dataset_type"))
        )

        rows = db.execute(summary_query).mappings().all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload errors table does not exist.",
        ) from e

    return {
        "data": [
            {
                "country_code": r["country_code"],
                "dataset_type": r["dataset_type"],
                "error_count": r["error_count"],
                "distinct_files": r["distinct_files"],
            }
            for r in rows
        ],
    }


@router.get("/download")
def download_upload_errors(
    country_code: str | None = Query(default=None),
    dataset_type: str | None = Query(default=None),
    file_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Download filtered error rows as CSV."""
    import pandas as pd

    base = select("*").select_from(text(UPLOAD_ERRORS_TABLE))

    filters = []
    if country_code:
        filters.append(column("country_code") == literal(country_code))
    if dataset_type:
        filters.append(column("dataset_type") == literal(dataset_type))
    if file_id:
        filters.append(column("giga_sync_file_id") == literal(file_id))

    filtered = base.where(*filters) if filters else base

    try:
        rows = (
            db.execute(filtered.order_by(column("created_at").desc())).mappings().all()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload errors table does not exist.",
        ) from e

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No error rows found matching the given filters.",
        )

    df = pd.DataFrame([_serialize_error_row(row) for row in rows])
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    filename = "upload_errors"
    if country_code:
        filename += f"_{country_code}"
    if dataset_type:
        filename += f"_{dataset_type}"
    filename += ".csv"

    return StreamingResponse(
        csv_buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
