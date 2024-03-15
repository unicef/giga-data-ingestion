def process_column(column_name, df):
    """
    Processes a DataFrame column for data quality checks.

    Assumes column names in "dq_{assertion}-{column}" format, where
    {assertion} is the check, and {column} is the target column. Returns None
    if the column doesn't start with "dq_".

    Checks the first 5 rows for errors (value = 1). Returns a dictionary with
    "assertion-column" as the key and a list of error rows for that column as
    the value. Only includes data for the column matching the "column" part.

    Parameters:
    - column_name (str): The column to process.
    - df (pandas.DataFrame): The DataFrame.

    Returns:
    - dict or None: {"assertion-column": [first five error rows]} or None.
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
        for _, row in df.head().iterrows():
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
