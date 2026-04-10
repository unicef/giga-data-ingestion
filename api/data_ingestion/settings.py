import socket
from datetime import timedelta
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import sentry_sdk
from loguru import logger
from pydantic import AliasChoices, AnyUrl, Field, PostgresDsn, RedisDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration


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
    AZURE_SUSI_AUTH_POLICY_NAME: str
    AZURE_REDIRECT_URI: str
    AZURE_SAS_TOKEN: str = ""
    AZURE_BLOB_CONTAINER_NAME: str
    AZURE_STORAGE_ACCOUNT_NAME: str
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    WEB_APP_REDIRECT_URI: str
    MAILJET_API_KEY: str
    MAILJET_API_URL: str
    MAILJET_SECRET_KEY: str
    SENDER_EMAIL: str
    EMAIL_RENDERER_BEARER_TOKEN: str
    EMAIL_RENDERER_SERVICE_URL: AnyUrl
    TRINO_USERNAME: str
    TRINO_PASSWORD: str = ""
    REDIS_PASSWORD: str

    # NocoDB envs for Fuzzy Matching Mappings
    NOCODB_BASE_URL: str
    NOCODB_TOKEN: str
    NOCODB_NAME_MAPPINGS_TABLE_ID: str

    # Optional envs
    PYTHON_ENV: Environment = Environment.PRODUCTION
    DEPLOY_ENV: DeploymentEnvironment = DeploymentEnvironment.LOCAL
    BASE_DIR: Path = Path(__file__).parent.parent
    ALLOWED_HOSTS: list[str] = ["*"]
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    AZURE_EDIT_PROFILE_AUTH_POLICY_NAME: str = ""
    AZURE_PASSWORD_RESET_AUTH_POLICY_NAME: str = ""
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    SENTRY_DSN: str = Field(
        default="", validation_alias=AliasChoices("SENTRY_DSN", "SENTRY_DSN_BACKEND")
    )
    SENTRY_ENABLE_IN_LOCAL: bool = False
    SENTRY_SEND_DEFAULT_PII: bool = False
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0
    SENTRY_PROFILES_SAMPLE_RATE: float = 0.0
    SENTRY_MAX_REQUEST_BODY_SIZE: Literal[
        "never", "small", "medium", "always"
    ] = "never"
    SENTRY_INCLUDE_SOURCE_CONTEXT: bool = False
    SENTRY_INCLUDE_LOCAL_VARIABLES: bool = False
    SENTRY_DEBUG: bool = False
    COMMIT_SHA: str = ""
    TRINO_HOST: str = "trino"
    TRINO_PORT: int = 8080
    TRINO_CATALOG: str = "delta_lake"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_CACHE_DEFAULT_TTL_SECONDS: int = int(timedelta(minutes=10).total_seconds())
    ADMIN_EMAIL: str = ""
    LAKEHOUSE_USERNAME: str = ""
    GIGAMETER_API_BASE_URL: str = ""
    GIGAMETER_API_TOKEN: str = ""
    SYSTEM_USER_ID: str = "11223344-5566-4788-9900-aabbccddeeff"
    SYSTEM_USER_EMAIL: str = "giga_meter@gigasync.org"

    @computed_field
    @property
    def ADMIN_EMAIL_LIST(self) -> list[str]:
        return self.ADMIN_EMAIL.strip("[]").replace('"', "").split(",")

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
    def OPENID_CONFIG_URL(self) -> str:
        return f"https://{self.AZURE_TENANT_NAME}.b2clogin.com/{self.AUTHORITY_DOMAIN}/{self.AZURE_SUSI_AUTH_POLICY_NAME}/v2.0/.well-known/openid-configuration"

    @computed_field
    @property
    def OPENAPI_AUTHORIZATION_URL(self) -> str:
        return f"https://{self.AZURE_TENANT_NAME}.b2clogin.com/{self.AUTHORITY_DOMAIN}/{self.AZURE_SUSI_AUTH_POLICY_NAME}/oauth2/v2.0/authorize"

    @computed_field
    @property
    def OPENAPI_TOKEN_URL(self) -> str:
        return f"https://{self.AZURE_TENANT_NAME}.b2clogin.com/{self.AUTHORITY_DOMAIN}/{self.AZURE_SUSI_AUTH_POLICY_NAME}/oauth2/v2.0/token"

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
        connection_dict = {
            "username": self.TRINO_USERNAME,
            "host": self.TRINO_HOST,
            "port": self.TRINO_PORT,
            "path": self.TRINO_CATALOG,
        }
        if self.TRINO_PASSWORD:
            connection_dict["password"] = self.TRINO_PASSWORD
        return connection_dict

    @computed_field
    @property
    def TRINO_URL(self) -> str:
        return str(
            PostgresDsn.build(
                scheme="trino",
                **self.TRINO_CONNECTION_DICT,
            )
        )

    @computed_field
    @property
    def CLEAN_MAILJET_SECRET(self) -> str:
        dirty = self.MAILJET_SECRET_KEY

        return dirty.replace("\n", "")

    @computed_field
    @property
    def LAKEHOUSE_PATH(self) -> str:
        if self.PYTHON_ENV == Environment.LOCAL:
            if self.LAKEHOUSE_USERNAME:
                return f"lakehouse-local-{self.LAKEHOUSE_USERNAME}"
            return "lakehouse-local"
        return ""


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()


def _scrub_sentry_event(event: dict[str, Any], _hint: dict[str, Any]) -> dict[str, Any]:
    """Minimize accidental PII leakage in captured request/user payloads."""
    request = event.get("request")
    if isinstance(request, dict):
        request.pop("cookies", None)
        request.pop("headers", None)
        request.pop("data", None)
        request.pop("query_string", None)

        url = request.get("url")
        if isinstance(url, str):
            request["url"] = url.split("?", maxsplit=1)[0]

    user = event.get("user")
    if isinstance(user, dict):
        user.pop("email", None)
        user.pop("ip_address", None)
        user.pop("username", None)

    return event


def initialize_sentry():
    sentry_enabled = bool(settings.SENTRY_DSN) and (
        settings.IN_PRODUCTION or settings.SENTRY_ENABLE_IN_LOCAL
    )
    if sentry_enabled:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            send_default_pii=settings.SENTRY_SEND_DEFAULT_PII,
            integrations=[
                FastApiIntegration(transaction_style="url"),
                CeleryIntegration(),
                RedisIntegration(),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
            max_request_body_size=settings.SENTRY_MAX_REQUEST_BODY_SIZE,
            include_source_context=settings.SENTRY_INCLUDE_SOURCE_CONTEXT,
            include_local_variables=settings.SENTRY_INCLUDE_LOCAL_VARIABLES,
            debug=settings.SENTRY_DEBUG,
            environment=settings.DEPLOY_ENV,
            release=f"github.com/unicef/giga-data-ingestion:{settings.COMMIT_SHA}",
            server_name=f"ingestion-portal-api-{settings.DEPLOY_ENV.name}@{socket.gethostname()}",
            before_send=_scrub_sentry_event,
        )
        logger.info("Initialized Sentry.")
