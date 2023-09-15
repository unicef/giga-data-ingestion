from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PYTHON_ENV: Literal["development", "staging", "production"] = "production"
    IN_PRODUCTION: bool = PYTHON_ENV == "production"
    BASE_DIR: Path = Path(__file__).parent.parent
    STATICFILES_DIR: Path = BASE_DIR / "static"
    ALLOWED_HOSTS: list[str] = ["*"]
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    SECRET_KEY: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
