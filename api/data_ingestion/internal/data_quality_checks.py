import json
import os
from io import StringIO

import pandas as pd
from azure.storage.blob import BlobProperties
from fastapi import (
    HTTPException,
    status,
)

from data_ingestion.internal.storage import storage_client
from data_ingestion.utils.data_quality import process_n_columns


def get_data_quality_summary(dq_report_path: str):
    dq_report_summary_dict = []

    dq_summary_path = dq_report_path.replace("dq_failed_rows", "dq_summary")
    base, ext = os.path.splitext(dq_summary_path)
    dq_summary_path = base + ".json"

    blob_list = storage_client.list_blobs(name_starts_with=dq_summary_path)
    first_blob = next(blob_list, None)

    if first_blob:
        blob_client = storage_client.get_blob_client(first_blob.name)
        blob_data = blob_client.download_blob().readall()
        dq_report_summary = blob_data.decode("utf-8")
        dq_report_summary_dict = json.loads(dq_report_summary)
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DQ report summary still does not exist",
        )

    return dq_report_summary_dict


def get_first_n_error_rows_for_data_quality_check(
    dq_report_path: str,
    rows_to_process: int = 5,
) -> tuple[BlobProperties, dict]:
    results = {}

    blob_list = storage_client.list_blobs(name_starts_with=dq_report_path)
    first_blob = next(blob_list, None)

    blob = storage_client.get_blob_client(first_blob.name)
    blob_properties = blob.get_blob_properties()

    if first_blob:
        blob = storage_client.get_blob_client(first_blob.name)
        blob_properties = blob.get_blob_properties()

        blob_client = storage_client.get_blob_client(blob=blob_properties.name)
        blob_data = blob_client.download_blob().readall()
        data_str = blob_data.decode("utf-8")
        data_io = StringIO(data_str)
        df = pd.read_csv(data_io)

        for column in df.columns:
            column_result = process_n_columns(column, df, rows_to_process)
            if column_result:
                results.update(column_result)

    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DQ report does not exist in azure storage",
        )

    return blob_properties, results
