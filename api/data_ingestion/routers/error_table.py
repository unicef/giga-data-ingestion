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


def get_upload_error_tables(db: Session) -> list[str]:
    keys = (
        db.execute(
            select(column("table_name"))
            .select_from(text("information_schema.tables"))
            .where(
                (column("table_schema") == literal("school_master"))
                & column("table_name").like("upload_errors_%")
            )
        )
        .mappings()
        .all()
    )
    return [f"school_master.{row['table_name']}" for row in keys]


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
        target_table = f"school_master.upload_errors_{country_code.lower()}"
        tables = [t for t in tables if t == target_table]

    if not tables:
        return {
            "data": [],
            "page": page,
            "page_size": page_size,
            "total_count": 0,
        }

    # If querying multiple tables without country_code, we must do it safely.
    # We will query all tables one by one (or using simple UNION ALL if columns were guaranteed).
    # Since we use SELECT *, Trino UNION ALL fails on differing schemas.
    # We will iterate in Python, applying filters to each query, to calculate total counts and collect rows.
    total_count = 0
    all_rows = []

    for table_name in tables:
        base = select("*").select_from(text(table_name))
        filters = []
        if dataset_type:
            filters.append(column("dataset_type") == literal(dataset_type))
        if file_id:
            filters.append(column("giga_sync_file_id") == literal(file_id))

        filtered = base.where(*filters) if filters else base
        try:
            tbl_count = db.execute(
                select(func.count()).select_from(filtered.subquery())
            ).scalar()
            total_count += tbl_count

            # Note: Pagination across multiple tables dynamically in python is tricky.
            # We fetch all matching from each table, then sort & slice at the end if no country provided.
            # If country is provided, it's just 1 table and we can limit dynamically in SQL, but for safety:
            rows = db.execute(filtered).mappings().all()
            all_rows.extend(rows)
        except Exception:
            # If an error occurs (e.g. table not totally initialized), skip
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
        target_table = f"school_master.upload_errors_{country_code.lower()}"
        tables = [t for t in tables if t == target_table]

    if not tables:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No error tables found matching the given filters.",
        )

    all_rows = []

    for table_name in tables:
        base = select("*").select_from(text(table_name))
        filters = []
        if dataset_type:
            filters.append(column("dataset_type") == literal(dataset_type))
        if file_id:
            filters.append(column("giga_sync_file_id") == literal(file_id))

        filtered = base.where(*filters) if filters else base
        try:
            rows = db.execute(filtered).mappings().all()
            all_rows.extend(rows)
        except Exception:
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
