import json
from io import BytesIO, StringIO

import pandas as pd
from fastapi import (
    HTTPException,
    status,
)
from loguru import logger

from azure.storage.blob import BlobProperties
from data_ingestion.internal.storage import storage_client
from data_ingestion.utils.data_quality import process_n_columns


def get_data_quality_summary(dq_report_path: str):
    blob = storage_client.get_blob_client(dq_report_path)

    if not blob.exists():
        logger.error("DQ report summary still does not exist")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found",
        )

    blob_properties = blob.get_blob_properties()
    if blob_properties.size == 0:
        logger.warning(f"DQ summary at {dq_report_path} is empty.")
        return {}

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


def _read_spark_parquet_directory(dq_full_path: str) -> pd.DataFrame:
    """Read a Spark-written parquet directory by finding part-*.parquet files.

    Spark writes parquet as a directory containing part-*.snappy.parquet files.
    The Azure Blob API sees the directory path itself as a 0-byte marker blob.
    This helper lists the blobs under that prefix and reads the actual data files.
    """
    prefix = dq_full_path.rstrip("/") + "/"
    part_blobs = [
        blob
        for blob in storage_client.list_blobs(name_starts_with=prefix)
        if blob.name.endswith(".parquet")
    ]

    if not part_blobs:
        logger.warning(
            f"No part-*.parquet files found under Spark directory: {dq_full_path}"
        )
        return pd.DataFrame()

    frames = []
    for part_blob in part_blobs:
        part_client = storage_client.get_blob_client(part_blob.name)
        part_data = part_client.download_blob().readall()
        if len(part_data) > 0:
            frames.append(pd.read_parquet(BytesIO(part_data)))

    if not frames:
        return pd.DataFrame()

    return pd.concat(frames, ignore_index=True)


def get_first_n_error_rows_for_data_quality_check(
    dq_full_path: str,
    rows_to_process: int = 5,
) -> tuple[BlobProperties, dict]:
    results = {}

    blob = storage_client.get_blob_client(dq_full_path)
    if not blob.exists():
        logger.error("DQ report does not exist in azure storage")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not Found",
        )

    blob_properties = blob.get_blob_properties()

    if dq_full_path.endswith(".csv"):
        if blob_properties.size == 0:
            logger.warning(f"DQ report at {dq_full_path} is empty.")
            return blob_properties, {}
        blob_data = blob.download_blob().readall()
        data_str = blob_data.decode("utf-8")
        data_io = StringIO(data_str)
        df = pd.read_csv(data_io)
    elif dq_full_path.endswith(".parquet"):
        if blob_properties.size == 0:
            # Spark writes parquet as a directory of part-files; the directory
            # marker itself is a 0-byte blob. Read the actual part-files.
            logger.info(
                f"Detected Spark parquet directory at {dq_full_path}, "
                "reading part-files."
            )
            df = _read_spark_parquet_directory(dq_full_path)
            if df.empty:
                logger.warning(
                    f"DQ report at {dq_full_path} has no data "
                    "(empty Spark parquet directory)."
                )
                return blob_properties, {}
        else:
            # Single-file parquet (non-Spark writer)
            blob_data = blob.download_blob().readall()
            data_io = BytesIO(blob_data)
            df = pd.read_parquet(data_io)
    else:
        raise ValueError("File type not supported")

    for column in df.columns:
        column_result = process_n_columns(column, df, rows_to_process)
        if column_result:
            results.update(column_result)

    return blob_properties, results
