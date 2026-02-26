import json
from io import BytesIO, StringIO

import pandas as pd
from fastapi import (
    HTTPException,
    status,
)
from loguru import logger

from azure.core.exceptions import HttpResponseError
from data_ingestion.internal.storage import storage_client
from data_ingestion.utils.data_quality import get_metadata_path, process_n_columns


def get_data_quality_summary(dq_report_path: str):
    blob = storage_client.get_blob_client(dq_report_path)

    if not blob.exists():
        logger.error("DQ report summary still does not exist")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found",
        )

    blob_data = blob.download_blob().readall()
    dq_report_summary = blob_data.decode("utf-8")
    dq_report_summary_dict: dict = json.loads(dq_report_summary)

    for group in dq_report_summary_dict.keys():
        if group == "summary":
            continue

        dq_report_summary_dict[group] = sorted(
            dq_report_summary_dict[group],
            key=lambda x: (
                -int("mandatory" in x["assertion"]),
                -x["count_failed"],
                x["column"],
            ),
        )

    return dq_report_summary_dict


def get_first_n_error_rows_for_data_quality_check(
    dq_full_path: str,
    rows_to_process: int = 5,
) -> tuple[dict, dict]:
    results = {}

    blob = storage_client.get_blob_client(dq_full_path)
    if not blob.exists():
        logger.error("DQ report does not exist in azure storage")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found",
        )

    # Try reading metadata from metadata file, fallback to blob metadata
    try:
        metadata_file_path = get_metadata_path(dq_full_path)
        metadata_blob_client = storage_client.get_blob_client(metadata_file_path)
        metadata = json.loads(metadata_blob_client.download_blob().readall())
    except HttpResponseError:
        props = blob.get_blob_properties()
        metadata = dict(props.metadata or {})

    blob_data = blob.download_blob().readall()

    if dq_full_path.endswith(".csv"):
        data_str = blob_data.decode("utf-8")
        data_io = StringIO(data_str)
        df = pd.read_csv(data_io)
    elif dq_full_path.endswith(".parquet"):
        data_io = BytesIO(blob_data)
        df = pd.read_parquet(data_io)
    else:
        raise ValueError("File type not supported")

    for column in df.columns:
        column_result = process_n_columns(column, df, rows_to_process)
        if column_result:
            results.update(column_result)

    return metadata, results
