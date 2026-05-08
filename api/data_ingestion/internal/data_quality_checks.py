import json

from fastapi import (
    HTTPException,
    status,
)
from loguru import logger

from data_ingestion.internal.storage import storage_client


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
