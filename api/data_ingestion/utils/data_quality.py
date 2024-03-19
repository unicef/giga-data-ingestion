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

        # Iterate over the first 5 rows and check if the value is 1
        for _, row in df.head(rows).iterrows():
            if row[column_name] == 1:
                # Include only the data for the specific column if it matches
                filtered_row = (
                    {column_name_part: row[column_name_part]}
                    if column_name_part in row
                    else {}
                )
                if filtered_row:  # Add row if it contains the column data
                    rows_with_error.append(filtered_row)

        # Return the result as a single object with key-value pairs
        return {key: rows_with_error} if rows_with_error else None
    else:
        return None
