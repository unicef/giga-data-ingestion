from pathlib import Path

import pandas as pd

from data_ingestion.constants import constants

BASE_CONTEXT_COLUMNS = ["school_id_govt", "school_name", "admin1", "admin2"]

LOCATION_COLUMNS = ["latitude", "longitude"]

LOCATION_ROW_ASSERTIONS = {
    "is_not_within_country",
    "is_school_density_greater_than_5",
    "uninhabited",
    "duplicate_within_110m_radius",
    "duplicate_name_level_within_110m_radius",
    "duplicate_similar_name_same_level_within_110m_radius",
    "duplicate_all_except_school_code",
    "duplicate_set",
    "duplicate_50_flag",
    "duplicate_50_count",
    "duplicate_50_group_id",
}

EDUCATION_LEVEL_ASSERTIONS = {
    "duplicate_name_level_within_110m_radius",
    "duplicate_similar_name_same_level_within_110m_radius",
}

COLUMN_RELATION_PAIRS: dict[str, list[str]] = {
    "connectivity_govt_download_speed_contracted": [
        "connectivity_govt",
        "download_speed_contracted",
    ],
    "electricity_availability_electricity_type": [
        "electricity_availability",
        "electricity_type",
    ],
}


def _get_context_columns(
    assertion: str, column_name_part: str, available_columns: list[str]
) -> list[str]:
    """Return the columns to include in the error preview for a given assertion."""
    present = set(available_columns)
    cols: list[str] = [c for c in BASE_CONTEXT_COLUMNS if c in present]

    if column_name_part in ("latitude", "longitude"):
        cols += [lc for lc in LOCATION_COLUMNS if lc in present and lc not in cols]
    elif column_name_part in COLUMN_RELATION_PAIRS:
        cols += [c for c in COLUMN_RELATION_PAIRS[column_name_part] if c in present]
    elif column_name_part and column_name_part in present:
        cols.append(column_name_part)
    else:
        if assertion in LOCATION_ROW_ASSERTIONS:
            cols += [lc for lc in LOCATION_COLUMNS if lc in present]
        if assertion in EDUCATION_LEVEL_ASSERTIONS and "education_level" in present:
            cols.append("education_level")

    return cols


def process_n_columns(column_name: str, df: pd.DataFrame, rows: int) -> dict | None:
    """
    :param column_name: The column to process.
    :param df: The DataFrame.
    :param rows: number of rows to process

    :return: {"assertion-column": [first five error rows]} or None.
    """
    parts = column_name.split("_", 1)
    if not (len(parts) > 1 and parts[0] == "dq"):
        return None

    assertion_info = parts[1].split("-", 1)
    assertion = assertion_info[0]
    column_name_part = assertion_info[1] if len(assertion_info) > 1 else ""

    key = f"{assertion}-{column_name_part}"
    df_filtered = df[df[column_name] == 1].head(rows)

    cols_to_show = _get_context_columns(
        assertion, column_name_part, list(df_filtered.columns)
    )
    rows_with_error = df_filtered[cols_to_show].to_dict("records")
    return {key: rows_with_error} if rows_with_error else None


def get_metadata_path(filepath: str) -> str:
    # Normalize paths by stripping leading slashes for comparison
    normalized_filepath = filepath.lstrip("/")
    normalized_prefix = constants.UPLOAD_PATH_PREFIX.lstrip("/")
    normalized_metadata_prefix = constants.UPLOAD_METADATA_PATH_PREFIX.lstrip("/")

    if normalized_filepath.startswith(normalized_prefix):
        return (
            normalized_filepath.replace(
                normalized_prefix, normalized_metadata_prefix, 1
            )
            + ".metadata.json"
        )

    file_path = Path(filepath)
    metadata_file_path = f"{file_path.stem}.metadata.json"
    return str(file_path.parent / metadata_file_path)
