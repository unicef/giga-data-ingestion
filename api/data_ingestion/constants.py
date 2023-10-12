from functools import lru_cache
from uuid import UUID

from pydantic_settings import BaseSettings

from data_ingestion.internal.utils import megabytes_to_bytes


class Constants(BaseSettings):
    ROLE_ID_LOOKUP: dict[str, UUID] = {
        "admin": UUID("da14bc09-8f35-4eaa-a459-67dd9030f1ed"),
        "user": UUID("b84fa0fc-029d-4209-9b4d-501f6d14ea38"),
    }
    UPLOAD_FILE_SIZE_LIMIT_MB: int | float = 10

    @property
    def UPLOAD_FILE_SIZE_LIMIT(self) -> int | float:
        return megabytes_to_bytes(self.UPLOAD_FILE_SIZE_LIMIT_MB)


@lru_cache
def get_constants():
    return Constants()


constants = get_constants()
