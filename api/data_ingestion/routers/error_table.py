import io

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

from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme

router = APIRouter(
    prefix="/api/error-table",
    tags=["error-table"],
    dependencies=[Security(azure_scheme)],
)


ERRORS_SCHEMA = "school_geolocation_error_table"


def get_upload_error_tables(db: Session) -> list[str]:
    keys = (
        db.execute(
            select(column("table_name"))
            .select_from(text("information_schema.tables"))
            .where(column("table_schema") == literal(ERRORS_SCHEMA))
        )
        .mappings()
        .all()
    )
    return [f"{ERRORS_SCHEMA}.{row['table_name']}" for row in keys]


def _serialize_error_row(row: dict) -> dict:
    """Serialize a single error row from the upload_errors table."""
    return {
        "giga_sync_file_id": row.get("giga_sync_file_id"),
        "giga_sync_file_name": row.get("giga_sync_file_name"),
        "dataset_type": row.get("dataset_type"),
        "country_code": row.get("country_code"),
        # Mandatory columns
        "school_id_govt": row.get("school_id_govt"),
        "school_id_giga": row.get("school_id_giga"),
        "school_name": row.get("school_name"),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "education_level": row.get("education_level")
        or row.get("education_level_govt"),
        # Failure reason
        "failure_reason": row.get("failure_reason"),
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
    tables = get_upload_error_tables(db)
    if country_code:
        target_table = f"{ERRORS_SCHEMA}.{country_code.lower()}"
        tables = [t for t in tables if t == target_table]

    if not tables:
        return {
            "data": [],
            "page": page,
            "page_size": page_size,
            "total_count": 0,
        }

    # We explicitly select only the required columns to prevent Trino's python driver from failing
    # to parse complex types (e.g., MAP types like dq_results).
    selected_cols = [
        "giga_sync_file_id",
        "giga_sync_file_name",
        "dataset_type",
        "country_code",
        "school_id_govt",
        "school_id_giga",
        "school_name",
        "latitude",
        "longitude",
        "education_level",
        "education_level_govt",
        "failure_reason",
        "created_at",
    ]

    total_count = 0
    all_rows = []

    for table_name in tables:
        base = select(*[column(c) for c in selected_cols]).select_from(text(table_name))
        filters = []
        if dataset_type:
            filters.append(column("dataset_type") == literal(dataset_type))
        if file_id:
            filters.append(column("giga_sync_file_id") == literal(file_id))

        filtered = base.where(*filters) if filters else base
        try:
            # Avoid anonymous subqueries which can fail in SQLAlchemy 2.0 with Trino
            count_query = select(func.count()).select_from(text(table_name))
            if filters:
                count_query = count_query.where(*filters)

            tbl_count = db.execute(count_query).scalar()
            total_count += tbl_count

            # Note: Pagination across multiple tables dynamically in python is tricky.
            rows = db.execute(filtered).mappings().all()
            all_rows.extend(rows)
        except Exception as e:
            # If an error occurs (e.g. table not totally initialized or explicit columns missing), skip
            print(f"Error querying table {table_name}: {e}")
            continue

    all_rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    paged_rows = all_rows[(page - 1) * page_size : page * page_size]

    data = [_serialize_error_row(row) for row in paged_rows]

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
    tables = get_upload_error_tables(db)
    if not tables:
        return {"data": []}

    queries = []
    for table_name in tables:
        queries.append(
            select(
                column("country_code"),
                column("dataset_type"),
                func.count().label("error_count"),
                func.count(column("giga_sync_file_id").distinct()).label(
                    "distinct_files"
                ),
            )
            .select_from(text(table_name))
            .group_by(column("country_code"), column("dataset_type"))
        )

    # We can UNION ALL these safely because we are explicitly selecting 4 standard columns that must exist.
    from sqlalchemy import union_all

    summary_query = union_all(*queries).order_by(
        column("country_code"), column("dataset_type")
    )

    try:
        rows = db.execute(summary_query).mappings().all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to retrieve summary from error tables.",
        ) from e

    # since union all across tables might duplicate country_code/dataset_type pairs if somehow mixed, we group in python safely
    summary_dict = {}
    for r in rows:
        key = (r["country_code"], r["dataset_type"])
        if key not in summary_dict:
            summary_dict[key] = {"error_count": 0, "distinct_files": 0}
        summary_dict[key]["error_count"] += r["error_count"]
        summary_dict[key]["distinct_files"] += r["distinct_files"]

    results = [
        {
            "country_code": k[0],
            "dataset_type": k[1],
            "error_count": v["error_count"],
            "distinct_files": v["distinct_files"],
        }
        for k, v in summary_dict.items()
    ]

    return {"data": results}


@router.get("/download")
def download_upload_errors(
    country_code: str | None = Query(default=None),
    dataset_type: str | None = Query(default=None),
    file_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Download filtered error rows as CSV."""
    import pandas as pd

    tables = get_upload_error_tables(db)
    if country_code:
        target_table = f"{ERRORS_SCHEMA}.{country_code.lower()}"
        tables = [t for t in tables if t == target_table]

    if not tables:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No error tables found matching the given filters.",
        )

    selected_cols = [
        "giga_sync_file_id",
        "giga_sync_file_name",
        "dataset_type",
        "country_code",
        "school_id_govt",
        "school_id_giga",
        "school_name",
        "latitude",
        "longitude",
        "education_level",
        "education_level_govt",
        "failure_reason",
        "created_at",
    ]

    all_rows = []

    for table_name in tables:
        base = select(*[column(c) for c in selected_cols]).select_from(text(table_name))
        filters = []
        if dataset_type:
            filters.append(column("dataset_type") == literal(dataset_type))
        if file_id:
            filters.append(column("giga_sync_file_id") == literal(file_id))

        filtered = base.where(*filters) if filters else base
        try:
            rows = db.execute(filtered).mappings().all()
            all_rows.extend(rows)
        except Exception as e:
            print(f"Error querying table {table_name}: {e}")
            continue

    if not all_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No error rows found matching the given filters.",
        )

    all_rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)

    # Export all columns to match the dq_results schema (not the UI subset)
    df = pd.DataFrame([dict(row) for row in all_rows])
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
