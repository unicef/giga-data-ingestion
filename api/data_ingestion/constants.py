import tomllib
from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings

from data_ingestion.internal.utils import megabytes_to_bytes
from data_ingestion.settings import settings


class Constants(BaseSettings):
    APPROVAL_REQUESTS_PATH_PREFIX: str = "raw/approval_requests"
    UPLOAD_FILE_SIZE_LIMIT_MB: int | float = 10
    UPLOAD_PATH_PREFIX: str = "raw/uploads"
    API_INGESTION_SCHEMA_UPLOAD_PATH: str = "schemas/qos/school-connectivity"
    VALID_UPLOAD_TYPES: dict[str, list[str]] = {
        "application/json": [".json"],
        "application/octet-stream": [".parquet"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "text/csv": [".csv"],
        "application/csv": [".csv"],
    }
    ALLOWED_SCHEMA_NAMES: list[str] = [
        "qos",
        "school_master",
        "school_reference",
        "school_geolocation",
        "school_coverage",
    ]

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
