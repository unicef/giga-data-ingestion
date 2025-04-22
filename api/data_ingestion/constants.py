import tomllib
from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings

from data_ingestion.internal.utils import megabytes_to_bytes
from data_ingestion.settings import settings


class Constants(BaseSettings):
    APPROVAL_REQUESTS_PATH_PREFIX: str = (
        f"{settings.LAKEHOUSE_PATH}/raw/approval_requests"
    )
    APPROVAL_REQUESTS_RESULT_UPLOAD_PATH: str = f"{settings.LAKEHOUSE_PATH}/staging"
    UPLOAD_FILE_SIZE_LIMIT_MB: int | float = 10
    UPLOAD_PATH_PREFIX: str = f"{settings.LAKEHOUSE_PATH}/raw/uploads"
    API_INGESTION_SCHEMA_UPLOAD_PATH: str = (
        f"{settings.LAKEHOUSE_PATH}/schemas/qos/school-connectivity"
    )

    VALID_UPLOAD_TYPES: dict[str, list[str]] = {
        "application/json": [".json"],
        "application/octet-stream": [".parquet"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "text/csv": [".csv"],
        "application/csv": [".csv"],
    }
    VALID_UNSTRUCTURED_UPLOAD_TYPES: dict[str, list[str]] = {
        "image/jpeg": [".jpeg", ".jpg"],
        "image/png": [".png"],
        "image/bmp": [".bmp"],
        "image/gif": [".gif"],
        "image/tiff": [".tif", ".tiff"],
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
            ".docx"
        ],
    }
    ALLOWED_SCHEMA_NAMES: list[str] = [
        "qos",
        "school_master",
        "school_reference",
        "school_geolocation",
        "school_coverage",
        "coverage_itu",
        "coverage_fb",
    ]

    FILENAME_TIMESTAMP_FORMAT: str = "%Y%m%d-%H%M%S"
    DATA_PRIVACY_DOCUMENT_PATH: str = "staticfiles/2023-11_School_data_request_FNL.pdf"

    @computed_field
    @property
    def UPLOAD_FILE_SIZE_LIMIT(self) -> int | float:
        return megabytes_to_bytes(self.UPLOAD_FILE_SIZE_LIMIT_MB)


@lru_cache
def get_constants():
    return Constants()


@lru_cache
def get_app_version() -> str:
    with open(settings.BASE_DIR / "pyproject.toml", "rb") as f:
        return (
            tomllib.load(f).get("tool", {}).get("poetry", {}).get("version", "unknown")
        )


constants = get_constants()
__version__ = get_app_version()
