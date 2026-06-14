from dataclasses import dataclass
from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

import orjson
from fastapi import Form, UploadFile
from pydantic import (
    UUID4,
    BaseModel,
    ConfigDict,
    EmailStr,
    constr,
    field_validator,
    model_validator,
)

T = TypeVar("T")

from data_ingestion.models.file_upload import DQStatusEnum
from data_ingestion.settings import settings


class FileUpload(BaseModel):
    id: str
    created: datetime
    uploader_id: UUID4
    uploader_email: EmailStr
    dq_report_path: str | None
    dq_full_path: str | None
    dq_status: DQStatusEnum
    bronze_path: str | None
    is_processed_in_staging: bool
    country: constr(min_length=3, max_length=3)
    dataset: str
    source: str | None
    mode: str | None
    approval_status: str | None
    original_filename: str
    column_to_schema_mapping: dict[str, str]
    column_license: dict[str, str]
    upload_path: str
    dq_mode: str | None = None
    data_owner: str | None
    rows: int | None
    rows_passed: int | None
    rows_failed: int | None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("uploader_id", mode="before")
    @classmethod
    def sanitize_uploader_id(cls, v):
        """sanitize_uploader_id"""
        v_str = str(v)
        if v_str.startswith("$("):
            return UUID(settings.SYSTEM_USER_ID)
        return v

    @field_validator("uploader_email", mode="before")
    @classmethod
    def sanitize_uploader_email(cls, v):
        """sanitize_uploader_email"""
        v_str = str(v)
        if v_str.startswith("$("):
            return settings.SYSTEM_USER_EMAIL
        return v

    @field_validator("column_to_schema_mapping", mode="before")
    @classmethod
    def validate_column_to_schema_mapping(cls, v: str | dict):
        """validate_column_to_schema_mapping"""
        if isinstance(v, str):
            v = orjson.loads(v)
        if isinstance(v, dict):
            return {k: str(val) if val is not None else "" for k, val in v.items()}
        return v

    @field_validator("column_license", mode="before")
    @classmethod
    def validate_column_license(cls, v: str | dict[str, str]):
        if isinstance(v, str):
            return orjson.loads(v)
        return v

    @model_validator(mode="after")
    def derive_pending_approval_status(self):
        # PENDING is never persisted: an upload is pending review once Dagster
        # has staged it (DQ passed) and no reviewer decision has been recorded.
        if (
            self.approval_status is None
            and self.dq_status == DQStatusEnum.COMPLETED
            and self.is_processed_in_staging
        ):
            self.approval_status = "PENDING"
        return self


@dataclass
class FileUploadRequest:
    file: UploadFile = Form(...)
    column_to_schema_mapping: str = Form(...)
    column_license: str = Form(...)
    country: str = Form(...)
    dataset: str = Form(...)
    metadata: str = Form(...)
    source: str | None = Form(None)
    fuzzy_corrections: str | None = Form(None)
    dq_mode: str = Form("master")
    fuzzy_corrections: str | None = Form(None)


@dataclass
class UnstructuredFileUploadRequest:
    file: UploadFile = Form(...)
    country: str = Form(...)
    metadata: str = Form(...)
    source: str | None = Form(None)


class UploadSummaryResponse(BaseModel):
    upload_id: str
    created: datetime
    file_name: str | None
    dataset: str | None = None
    uploader_email: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class UploadDetailsRequest(BaseModel):
    upload_ids: list[str]


class UploadDetailsResponse(BaseModel):
    upload_id: str
    country: str
    created: datetime
    file_name: str | None


@dataclass
class ValidateFuzzyRequest:
    file: UploadFile = Form(...)
    column_to_schema_mapping: str = Form(...)


class DataQualityCheckLabel(BaseModel):
    assertion: str
    column_key: str = ""
    ui_error_description: str
    dq_table_column_name: str | None = None
    dq_check_category: str | None = None
    column_checked: str | None = None
    human_readable_name: str | None = None
    active: bool = True
    sort_order: int | None = None
