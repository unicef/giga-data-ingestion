import csv
import io
import json
import logging

import requests

from data_ingestion.internal.storage import storage_client
from data_ingestion.settings import settings
from data_ingestion.utils.data_quality import get_metadata_path

logger = logging.getLogger(__name__)


GEOLOCATION_CSV_COLUMNS = [
    "school_id_giga",
    "school_id_govt",
    "school_name",
    "latitude",
    "longitude",
    "education_level",
]


def write_registration_csv_to_adls(
    payload: dict, file_upload, registration_metadata: dict
) -> None:
    """
    Formats the school registration payload as a single-row CSV and uploads it to ADLS.
    """
    row = {
        "school_id_giga": payload.get("giga_id_school", ""),
        "school_id_govt": payload.get("school_id", ""),
        "school_name": payload.get("school_name", ""),
        "latitude": payload.get("latitude", ""),
        "longitude": payload.get("longitude", ""),
        "education_level": payload.get("education_level", ""),
    }

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=GEOLOCATION_CSV_COLUMNS)
    writer.writeheader()
    writer.writerow(row)
    csv_bytes = output.getvalue().encode("utf-8")

    blob_client = storage_client.get_blob_client(file_upload.upload_path)
    blob_client.upload_blob(
        csv_bytes,
        overwrite=True,
        metadata={
            "country": file_upload.country,
            "uploader_email": file_upload.uploader_email,
            "school_id_giga": payload.get("giga_id_school", ""),
            "mode": "create",
        },
    )

    metadata_payload = {
        "country": file_upload.country,
        "uploader_email": file_upload.uploader_email,
        "dataset": "geolocation",
        "mode": "create",
        **registration_metadata,
    }
    metadata_path = get_metadata_path(file_upload.upload_path)
    metadata_blob_client = storage_client.get_blob_client(metadata_path)
    metadata_blob_client.upload_blob(
        json.dumps(metadata_payload, indent=2).encode(),
        overwrite=True,
    )


def call_meter_soft_delete(school_id_giga: str, rejection_reason: str = None) -> None:
    """
    Calls the GigaMeter API to soft-delete a school_new_registration record.
    """
    if not settings.GIGAMETER_API_BASE_URL or not settings.GIGAMETER_API_TOKEN:
        logger.warning(
            "GIGAMETER_API_BASE_URL or GIGAMETER_API_TOKEN not configured. "
            "Skipping soft-delete callback for school_id_giga=%s",
            school_id_giga,
        )
        return

    url = f"{settings.GIGAMETER_API_BASE_URL}/api/v1/school-registrations/rejection"
    headers = {
        "Authorization": f"Bearer {settings.GIGAMETER_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "giga_id_school": school_id_giga,
        "is_deleted": True,
        "rejection_reason": rejection_reason or "Rejected by admin",
    }

    response = requests.put(url, headers=headers, json=payload, timeout=10)
    response.raise_for_status()
    logger.info(
        "GigaMeter soft-delete successful for school_id_giga=%s", school_id_giga
    )
