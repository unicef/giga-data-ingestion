from pathlib import Path

import pandas as pd

from data_ingestion.constants import constants


def process_n_columns(column_name: str, df: pd.DataFrame, rows: int) -> dict | None:
    """
    :param column_name: The column to process.
    :param df: The DataFrame.
    :param rows: number of rows to process

    :return: {"assertion-column": [first five error rows]} or None.
    """
    parts = column_name.split("_", 1)
    if len(parts) > 1 and parts[0] == "dq":
        assertion_info = parts[1].split("-", 1)
        assertion = assertion_info[0]
        column_name_part = assertion_info[1] if len(assertion_info) > 1 else ""

        # Key for the result dictionary
        key = f"{assertion}-{column_name_part}"

        # Initialize the list for rows with errors
        rows_with_error = []

        # Get first n cells with an error as well as their values
        df_filtered = df[df[column_name] == 1].head(rows)
        if column_name_part in df_filtered.columns:
            df_filtered = df_filtered[[column_name_part]]
        rows_with_error = df_filtered.to_dict("records")

        # Return the result as a single object with key-value pairs
        return {key: rows_with_error} if rows_with_error else None
    else:
        return None


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
