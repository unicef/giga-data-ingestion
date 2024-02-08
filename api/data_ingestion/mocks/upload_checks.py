def get_upload_checks():
    column_checks_headers = [
        {"key": "columnName", "header": "Column name"},
        {"key": "expectedDataType", "header": "Expected Data Type"},
        {"key": "inDataset", "header": "Is the column in the dataset?"},
        {"key": "isCorrectLocation", "header": "Is the column in the right data type?"},
        {"key": "nullValues", "header": "How many null values per column?"},
        {"key": "uniqueValues", "header": "How many unique values per column?"},
    ]

    column_checks_rows = [
        {
            "id": key,
            "columnName": key,
            "columnDescription": f"some description for cell -{key}",
            "expectedDataType": "String",
            "inDataset": "Not Run",
            "isCorrectLocation": "Not Run",
            "nullValues": "Not Run",
            "uniqueValues": "Not Run",
        }
        for key in [
            "school_id",
            "school_name",
            "education_level",
            "internet_availability_type",
            "mobile_internet_generation",
            "internet_speed",
            "computer_availability",
            "school_year",
            "latitude",
            "longitude",
        ]
    ]

    duplicate_rows_check_headers = [
        {"key": "check", "header": "Check"},
        {"key": "count", "header": "Count"},
    ]

    duplicate_rows_check_rows = [
        {
            "id": key,
            "check": key,
            "count": "Not Run",
            "inDataset": "Not Run",
            "isCorrectLocation": "Not Run",
            "nullValues": "Not Run",
            "uniqueValues": "Not Run",
        }
        for key in [
            "Suspected duplicate rows with everything same except school code (dupx)",
            "Suspected duplicate rows with same school id, education level, school name, lat-lon (dup0)",  # noqa: E501 line too long
            "Suspected duplicate rows with same school name, education level, lat-lon (dup1)",  # noqa: E501
            "Suspected duplicate rows with same education level,lat-lon (dup2)",  # noqa: E501
            "Suspected duplicate rows with same school name and education level within 110m radius (dup3)",  # noqa: E501
            "Suspected duplicate rows with similar school name and same education level within 110m radius (dup4)",  # noqa: E501
        ]
    ]

    geospatial_data_points_checks_headers = [
        {"key": "check", "header": "Check"},
        {"key": "count", "header": "Count"},
    ]

    geospatial_data_points_checks_rows = [
        {
            "id": key,
            "check": key,
            "count": "Not Run",
            "inDataset": "Not Run",
            "isCorrectLocation": "Not Run",
            "nullValues": "Not Run",
            "uniqueValues": "Not Run",
        }
        for key in [
            "Schools outside country boundary",
            "Schools that have more than 5 schools within 70 square metre area (school_density_outlier_flag)",  # noqa: E501
            "Rows with latitude values with less than satisfactory precision (5 digits): 10",  # noqa: E501
        ]
    ]

    upload_checks = {
        "summary_checks": {
            "rows": 24601,
            "columns": 404,
        },
        "column_checks": {
            "headers": column_checks_headers,
            "rows": column_checks_rows,
        },
        "duplicate_rows": {
            "headers": duplicate_rows_check_headers,
            "rows": duplicate_rows_check_rows,
        },
        "geospatial_data_points": {
            "headers": geospatial_data_points_checks_headers,
            "rows": geospatial_data_points_checks_rows,
        },
    }

    return upload_checks
