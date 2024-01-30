import asyncio
from datetime import datetime
from typing import Annotated
from uuid import uuid4

import country_converter as coco
from azure.core.exceptions import HttpResponseError
from fastapi import (
    APIRouter,
    Form,
    HTTPException,
    Response,
    Security,
    UploadFile,
    status,
)

from data_ingestion.constants import constants
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.storage import storage_client

router = APIRouter(
    prefix="/api/upload",
    tags=["upload"],
    dependencies=[Security(azure_scheme)],
)


@router.post("")
async def upload_file(
    response: Response,
    file: UploadFile,
    dataset: str,
    sensitivity_level: Annotated[str, Form()],
    pii_classification: Annotated[str, Form()],
    geolocation_data_source: Annotated[str, Form()],
    data_collection_modality: Annotated[str, Form()],
    domain: Annotated[str, Form()],
    date_modified: Annotated[str, Form()],
    source: Annotated[str, Form()],
    data_owner: Annotated[str, Form()],
    country: Annotated[str, Form()],
    school_id_type: Annotated[str, Form()],
    description_file_update: Annotated[str, Form()],
):
    if file.size > constants.UPLOAD_FILE_SIZE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit",
        )
    uid = str(uuid4())

    country_code = coco.convert(country, to="ISO3")
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")

    filename = f"raw/uploads/{uid}_{country_code}_" f"{dataset}_{source}-{timestamp}"
    client = storage_client.get_blob_client(filename)

    try:
        metadata = {
            "sensitivity_level": sensitivity_level,
            "pii_classification": pii_classification,
            "geolocation_data_source": geolocation_data_source,
            "data_collection_modality": data_collection_modality,
            "domain": domain,
            "date_modified": date_modified,
            "source": source,
            "data_owner": data_owner,
            "country": country,
            "school_id_type": school_id_type,
            "description_file_update": description_file_update,
        }

        client.upload_blob(await file.read(), metadata=metadata)
        response.status_code = status.HTTP_201_CREATED
    except HttpResponseError as err:
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err


@router.get(
    "",
)
async def list_column_checks():
    await asyncio.sleep(2)

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
            "Suspected duplicate rows with same school id, education level, school name, lat-lon (dup0)",
            "Suspected duplicate rows with same school name, education level, lat-lon (dup1)",
            "Suspected duplicate rows with same education level,lat-lon (dup2)",
            "Suspected duplicate rows with same school name and education level within 110m radius (dup3)",
            "Suspected duplicate rows with similar school name and same education level within 110m radius (dup4)",
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
            "Schools that have more than 5 schools within 70 square metre area (school_density_outlier_flag)",
            "Rows with latitude values with less than satisfactory precision (5 digits): 10",
        ]
    ]

    upload_checks = {
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
