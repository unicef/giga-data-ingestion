"""
Utility for serving DQ Kit ZIP files in the ingestion API.
Tries to serve the pre-generated ZIP from Dagster first.
"""

import io
from pathlib import Path

from loguru import logger

from azure.core.exceptions import ResourceNotFoundError
from data_ingestion.facility_profiles import (
    FacilityProfileError,
    get_facility_profile,
)
from data_ingestion.internal.storage import storage_client
from data_ingestion.models.file_upload import FileUpload


class DQKitManager:
    """Serve DQ Kit ZIP files from individual ADLS artifacts."""

    def __init__(self, file_upload: FileUpload):
        self.file_upload = file_upload
        self.dataset = file_upload.dataset
        self.country = file_upload.country

        if file_upload.dq_full_path:
            self.stem = Path(file_upload.dq_full_path).stem
        else:
            self.stem = Path(file_upload.original_filename or "").stem

    @staticmethod
    def _blob_exists(blob_path: str) -> bool:
        try:
            return storage_client.get_blob_client(blob_path).exists()
        except Exception as e:
            logger.error(f"Error checking {blob_path}: {e}")
            return False

    @staticmethod
    def _get_blob_if_exists(blob_path: str | None) -> bytes | None:
        if not blob_path:
            return None
        try:
            blob_client = storage_client.get_blob_client(blob_path)
            if blob_client.exists():
                logger.info(f"Found file: {blob_path}")
                return blob_client.download_blob().readall()
            logger.warning(f"File not found: {blob_path}")
            return None
        except ResourceNotFoundError:
            logger.warning(f"File not found: {blob_path}")
            return None
        except Exception as e:
            logger.error(f"Error downloading {blob_path}: {e}")
            return None

    def _facility_profile(self):
        """Return the facility profile for geolocation uploads; raise if missing."""
        if self.dataset != "geolocation":
            return None
        schema_key = self.file_upload.schema_key
        if not schema_key:
            raise FacilityProfileError(
                f"Upload {self.file_upload.id} is geolocation but has no schema_key"
            )
        return get_facility_profile(schema_key)

    @property
    def _dataset_prefix(self) -> str:
        profile = self._facility_profile()
        if profile is not None:
            return profile.paths.dq_directory
        return (
            f"school-{self.dataset}"
            if self.dataset not in ("unstructured", "structured")
            else self.dataset
        )

    def _prebuilt_zip_candidates(self) -> list[str]:
        country = self.country
        stem = self.stem
        dq_root = f"data-quality-results/{self._dataset_prefix}"
        candidates: list[str] = []

        profile = self._facility_profile()
        if profile is not None:
            facility_type = profile.facility_type
            candidates.append(
                f"{dq_root}/dq-kit/{country}/DQ_Kit_{country}_{facility_type}_{stem}.zip"
            )
        else:
            candidates.append(
                f"{dq_root}/dq-kit/{country}/DQ_Kit_{country}_{self.dataset}_{stem}.zip"
            )
        return candidates

    def _map_html_candidates(self) -> list[str]:
        country = self.country
        stem = self.stem
        dq_root = f"data-quality-results/{self._dataset_prefix}"
        candidates: list[str] = []

        profile = self._facility_profile()
        if profile is not None:
            facility_type = profile.facility_type
            candidates.append(
                f"{dq_root}/dq-map/{country}/"
                f"{facility_type}_facility_map_{country}_{stem}.html"
            )
        else:
            candidates.append(
                f"{dq_root}/dq-map/{country}/school_map_{country}_{stem}.html"
            )
        return candidates

    def map_blob_path(self) -> str:
        """Return the map HTML blob path that exists, else the preferred convention."""
        candidates = self._map_html_candidates()
        for path in candidates:
            if self._blob_exists(path):
                return path
        return candidates[0]

    def generate_zip(self) -> io.BytesIO | None:
        """Return ZIP bytes from the pre-built Dagster artifact."""
        for path in self._prebuilt_zip_candidates():
            if prebuilt := self._get_blob_if_exists(path):
                logger.info(f"Serving pre-built DQ Kit ZIP from Dagster: {path}")
                buffer = io.BytesIO(prebuilt)
                buffer.seek(0)
                return buffer

        logger.info("Pre-built DQ Kit not found.")
        return None

    def get_zip_filename(self) -> str:
        profile = self._facility_profile()
        label = profile.facility_type if profile is not None else self.dataset
        return f"DQ_Kit_{self.country}_{label}_{self.file_upload.id}.zip"


def generate_dq_kit_zip(file_upload: FileUpload) -> tuple[io.BytesIO, str]:
    """Convenience function returning (zip_buffer, filename)."""
    generator = DQKitManager(file_upload)
    buffer = generator.generate_zip()
    if buffer is None:
        raise FileNotFoundError(f"DQ Kit ZIP not found for upload {file_upload.id}")
    return buffer, generator.get_zip_filename()


def get_map_blob_path(file_upload: FileUpload) -> str:
    """Return the conventional map HTML blob path for an upload."""
    return DQKitManager(file_upload).map_blob_path()
