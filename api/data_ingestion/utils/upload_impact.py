from collections import Counter

import pandas as pd


def normalize_school_id(value) -> str | None:
    if pd.isna(value):
        return None

    normalized = str(value).strip()
    if normalized == "" or normalized.lower() == "nan":
        return None

    return normalized


def get_school_id_file_column(column_mapping: dict[str, str]) -> str:
    for file_column, schema_column in column_mapping.items():
        if schema_column == "school_id_govt":
            return file_column

    raise ValueError("Column mapping must include school_id_govt.")


def build_upload_impact_preview(
    file_school_ids: list[str],
    total_rows: int,
    master_school_ids: set[str],
) -> dict[str, int]:
    rows_with_school_id = len(file_school_ids)
    missing_school_id_rows = total_rows - rows_with_school_id
    school_id_counts = Counter(file_school_ids)
    unique_school_ids = len(school_id_counts)
    # Count every row whose school ID is repeated, including its first
    # occurrence, so the total reflects all rows involved in a duplication.
    duplicate_school_id_rows = sum(
        count for count in school_id_counts.values() if count > 1
    )
    schools_to_update = sum(
        1 for school_id in file_school_ids if school_id in master_school_ids
    )
    new_schools = rows_with_school_id - schools_to_update

    return {
        "new_schools": new_schools,
        "schools_to_update": schools_to_update,
        "rows_with_school_id": rows_with_school_id,
        "missing_school_id_rows": missing_school_id_rows,
        "unique_school_ids": unique_school_ids,
        "duplicate_school_id_rows": duplicate_school_id_rows,
    }
