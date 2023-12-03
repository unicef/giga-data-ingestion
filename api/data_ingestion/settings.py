from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PYTHON_ENV: Literal["development", "staging", "production"] = "production"
    BASE_DIR: Path = Path(__file__).parent.parent
    ALLOWED_HOSTS: list[str] = ["*"]
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    SECRET_KEY: str
    AZURE_APPLICATION_ID: str
    AZURE_TENANT_NAME: str
    AZURE_TENANT_ID: str
    AZURE_CLIENT_ID: str
    AZURE_CLIENT_SECRET: str
    AZURE_AUTH_POLICY_NAME: str
    AZURE_REDIRECT_URI: str
    AZURE_SAS_TOKEN: str
    AZURE_BLOB_CONTAINER_NAME: str
    AZURE_STORAGE_ACCOUNT_NAME: str
    WEB_APP_REDIRECT_URI: str
    ZITADEL_CLIENT_ID: str
    ZITADEL_CLIENT_SECRET: str
    ZITADEL_AUTHORITY: str
    SENTRY_DSN: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def IN_PRODUCTION(self) -> bool:
        return self.PYTHON_ENV == "production"

    @property
    def STATICFILES_DIR(self) -> Path:
        return self.BASE_DIR / "static"

    @property
    def AUTHORITY_URL(self) -> str:
        return f"https://login.microsoftonline.com/{self.AZURE_TENANT_ID}"


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
