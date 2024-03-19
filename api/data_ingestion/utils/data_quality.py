import pandas as pd


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
