import socket
from datetime import timedelta
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Literal

import sentry_sdk
from loguru import logger
from pydantic import AnyUrl, PostgresDsn, RedisDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    LOCAL = "local"
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DeploymentEnvironment(StrEnum):
    LOCAL = "local"
    DEV = "dev"
    STG = "stg"
    PRD = "prd"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Required envs
    SECRET_KEY: str
    POSTGRESQL_USERNAME: str
    POSTGRESQL_PASSWORD: str
    POSTGRESQL_DATABASE: str
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
    MAILJET_SECRET_KEY: str
    SENDER_EMAIL: str
    EMAIL_RENDERER_BEARER_TOKEN: str
    EMAIL_RENDERER_SERVICE_URL: AnyUrl
    TRINO_USERNAME: str
    TRINO_PASSWORD: str
    REDIS_PASSWORD: str

    # Optional envs
    PYTHON_ENV: Environment = Environment.PRODUCTION
    DEPLOY_ENV: DeploymentEnvironment = DeploymentEnvironment.LOCAL
    BASE_DIR: Path = Path(__file__).parent.parent
    ALLOWED_HOSTS: list[str] = ["*"]
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    AZURE_SCOPE_DESCRIPTION: Literal["User.Impersonate"] = "User.Impersonate"
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    SENTRY_DSN: str = ""
    COMMIT_SHA: str = ""
    TRINO_HOST: str = "trino"
    TRINO_PORT: int = 8080
    TRINO_CATALOG: str = "delta_lake"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_CACHE_DEFAULT_TTL_SECONDS: int = int(timedelta(minutes=10).total_seconds())
    ADMIN_EMAIL: str = ""

    @computed_field
    @property
    def IN_PRODUCTION(self) -> bool:
        return self.PYTHON_ENV != Environment.LOCAL

    @computed_field
    @property
    def STATICFILES_DIR(self) -> Path:
        return self.BASE_DIR / "static"

    @computed_field
    @property
    def AUTHORITY_DOMAIN(self) -> str:
        return f"{self.AZURE_TENANT_NAME}.onmicrosoft.com"

    @computed_field
    @property
    def AZURE_SCOPE_NAME(self) -> str:
        return f"https://{self.AUTHORITY_DOMAIN}/{self.AZURE_CLIENT_ID}/{self.AZURE_SCOPE_DESCRIPTION}"

    @computed_field
    @property
    def AZURE_SCOPES(self) -> dict[str, str]:
        return {self.AZURE_SCOPE_NAME: self.AZURE_SCOPE_DESCRIPTION}

    @computed_field
    @property
    def OPENID_CONFIG_URL(self) -> str:
        return f"https://{self.AZURE_TENANT_NAME}.b2clogin.com/{self.AUTHORITY_DOMAIN}/{self.AZURE_AUTH_POLICY_NAME}/v2.0/.well-known/openid-configuration"

    @computed_field
    @property
    def OPENAPI_AUTHORIZATION_URL(self) -> str:
        return f"https://{self.AZURE_TENANT_NAME}.b2clogin.com/{self.AUTHORITY_DOMAIN}/{self.AZURE_AUTH_POLICY_NAME}/oauth2/v2.0/authorize"

    @computed_field
    @property
    def OPENAPI_TOKEN_URL(self) -> str:
        return f"https://{self.AZURE_TENANT_NAME}.b2clogin.com/{self.AUTHORITY_DOMAIN}/{self.AZURE_AUTH_POLICY_NAME}/oauth2/v2.0/token"

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
    def REDIS_CONNECTION_DICT(self) -> dict:
        return {
            "scheme": "redis",
            "password": self.REDIS_PASSWORD,
            "host": self.REDIS_HOST,
            "port": self.REDIS_PORT,
        }

    @computed_field
    @property
    def REDIS_CACHE_URL(self) -> str:
        return str(
            RedisDsn.build(
                **self.REDIS_CONNECTION_DICT,
                path="0",
            )
        )

    @computed_field
    @property
    def REDIS_QUEUE_URL(self) -> str:
        return str(
            RedisDsn.build(
                **self.REDIS_CONNECTION_DICT,
                path="1",
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

    @computed_field
    @property
    def TRINO_CONNECTION_DICT(self) -> dict:
        return {
            "username": self.TRINO_USERNAME,
            "password": self.TRINO_PASSWORD,
            "host": self.TRINO_HOST,
            "port": self.TRINO_PORT,
            "path": self.TRINO_CATALOG,
        }

    @computed_field
    @property
    def TRINO_URL(self) -> str:
        return str(
            PostgresDsn.build(
                scheme="trino",
                **self.TRINO_CONNECTION_DICT,
            )
        )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()


def initialize_sentry():
    if settings.IN_PRODUCTION and settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            sample_rate=1.0,
            enable_tracing=True,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
            environment=settings.DEPLOY_ENV,
            release=f"github.com/unicef/giga-data-ingestion:{settings.COMMIT_SHA}",
            server_name=f"ingestion-portal-api-{settings.DEPLOY_ENV.name}@{socket.gethostname()}",
        )
        logger.info("Initialized Sentry.")
