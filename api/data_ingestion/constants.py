import tomllib
from functools import lru_cache

from pydantic_settings import BaseSettings

from data_ingestion.internal.utils import megabytes_to_bytes
from data_ingestion.settings import settings


class Constants(BaseSettings):
    UPLOAD_FILE_SIZE_LIMIT_MB: int | float = 10

    @property
    def UPLOAD_FILE_SIZE_LIMIT(self) -> int | float:
        return megabytes_to_bytes(self.UPLOAD_FILE_SIZE_LIMIT_MB)


@lru_cache
def get_constants():
    return Constants()


@lru_cache
def get_app_version():
    with open(settings.BASE_DIR / "pyproject.toml", "rb") as f:
        return tomllib.load(f)["tool"]["poetry"]["version"]


constants = get_constants()
__version__ = get_app_version()
