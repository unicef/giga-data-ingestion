"""
Utility for serving DQ Kit ZIP files in the ingestion API.
Tries to serve the pre-generated ZIP from Dagster first
"""

import io
from pathlib import Path

from loguru import logger

from azure.core.exceptions import ResourceNotFoundError
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

    @property
    def _dataset_prefix(self) -> str:
        return (
            f"school-{self.dataset}"
            if self.dataset not in ("unstructured", "structured")
            else self.dataset
        )

    def _file_paths(self) -> dict[str, str | None]:
        prefix = self._dataset_prefix
        country = self.country
        stem = self.stem
        dq_root = f"data-quality-results/{prefix}"

        # Pre-built ZIP path (from Dagster `geolocation_dq_kit_zip` asset)
        prebuilt_zip = (
            f"{dq_root}/dq-kit/{country}/DQ_Kit_{country}_{self.dataset}_{stem}.zip"
        )

        return {
            "prebuilt_zip": prebuilt_zip,
            "raw_data": self.file_upload.upload_path,
            "dq_summary_json": self.file_upload.dq_report_path,
            "dq_report_txt": f"{dq_root}/dq-report/{country}/{stem}.txt",
            "passed_rows": f"{dq_root}/dq-passed-rows-human-readable/{country}/{stem}.csv",
            "failed_rows": f"{dq_root}/dq-failed-rows-human-readable/{country}/{stem}.csv",
            "dq_full_report": self.file_upload.dq_full_path,
            "map_html": f"{dq_root}/dq-map/{country}/school_map_{country}_{stem}.html",
        }

    def map_blob_path(self) -> str:
        """Return the conventional map HTML blob path for this upload."""
        return self._file_paths()["map_html"]  # type: ignore[return-value]

    def generate_zip(self) -> io.BytesIO:
        """
        Return ZIP bytes. Prefers the pre-built ZIP from Dagster; otherwise
        builds one on-demand from the available artifacts.
        """
        paths = self._file_paths()

        # Fast path: pre-built ZIP already exists
        if prebuilt := self._get_blob_if_exists(paths["prebuilt_zip"]):
            logger.info("Serving pre-built DQ Kit ZIP from Dagster")
            buffer = io.BytesIO(prebuilt)
            buffer.seek(0)
            return buffer

        logger.info("Pre-built DQ Kit not found. Building on-demand.")
        return None

    def get_zip_filename(self) -> str:
        return f"DQ_Kit_{self.country}_{self.dataset}_{self.file_upload.id}.zip"


def generate_dq_kit_zip(file_upload: FileUpload) -> tuple[io.BytesIO, str]:
    """Convenience function returning (zip_buffer, filename)."""
    generator = DQKitManager(file_upload)
    return generator.generate_zip(), generator.get_zip_filename()


def get_map_blob_path(file_upload: FileUpload) -> str:
    """Return the conventional map HTML blob path for an upload."""
    return DQKitManager(file_upload).map_blob_path()
