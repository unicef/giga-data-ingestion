from functools import lru_cache
from pathlib import Path
from typing import Literal

import sentry_sdk
from loguru import logger
from pydantic import AnyUrl, PostgresDsn, computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required envs
    SECRET_KEY: str
    POSTGRESQL_USERNAME: str
    POSTGRESQL_PASSWORD: str
    POSTGRESQL_DATABASE: str
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
    AZURE_EMAIL_CONNECTION_STRING: str
    AZURE_EMAIL_SENDER: str
    MAILJET_API_KEY: str
    MAILJET_API_URL: str
    EMAIL_RENDERER_BEARER_TOKEN: str
    EMAIL_RENDERER_SERVICE_URL: AnyUrl
    EMAIL_TEST_RECIPIENTS: list[str]

    # Optional envs
    PYTHON_ENV: Literal["local", "development", "staging", "production"] = "production"
    DEPLOY_ENV: Literal["local", "dev", "stg", "prd"] = "local"
    BASE_DIR: Path = Path(__file__).parent.parent
    ALLOWED_HOSTS: list[str] = ["*"]
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    SENTRY_DSN: str = ""
    COMMIT_SHA: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @computed_field
    @property
    def IN_PRODUCTION(self) -> bool:
        return self.PYTHON_ENV != "local"

    @computed_field
    @property
    def STATICFILES_DIR(self) -> Path:
        return self.BASE_DIR / "static"

    @computed_field
    @property
    def AUTHORITY_URL(self) -> str:
        return f"https://login.microsoftonline.com/{self.AZURE_TENANT_ID}"

    @computed_field
    @property
    def DATABASE_CONNECTION_DICT(self) -> dict:
        return {
            "username": self.POSTGRESQL_USERNAME,
            "password": self.POSTGRESQL_PASSWORD,
            "host": self.DB_HOST,
            "port": self.DB_PORT,
            "path": self.POSTGRESQL_DATABASE,
        }

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return str(
            PostgresDsn.build(
                scheme="postgresql+psycopg2",
                **self.DATABASE_CONNECTION_DICT,
            )
        )

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                **self.DATABASE_CONNECTION_DICT,
            )
        )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()


def initialize_sentry():
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
            environment=settings.DEPLOY_ENV,
            release=settings.COMMIT_SHA,
        )
        logger.info("Initialized Sentry.")
