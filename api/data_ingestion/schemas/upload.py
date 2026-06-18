from dataclasses import dataclass
from datetime import datetime

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

from data_ingestion.models.file_upload import DQStatusEnum


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

    @field_validator("column_to_schema_mapping", mode="before")
    @classmethod
    def validate_column_to_schema_mapping(cls, v: str | dict[str, str]):
        if isinstance(v, str):
            return orjson.loads(v)
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
    dq_mode: str = Form("master")
    fuzzy_corrections: str | None = Form(None)


@dataclass
class UnstructuredFileUploadRequest:
    file: UploadFile = Form(...)
    country: str = Form(...)
    metadata: str = Form(...)
    source: str | None = Form(None)
    # When "health", stores dataset=health and uses the health raw path (see upload_structured).
    portal_dataset: str | None = Form(None)


@dataclass
class ValidateFuzzyRequest:
    file: UploadFile = Form(...)
    column_to_schema_mapping: str = Form(...)


@dataclass
class UploadImpactPreviewRequest:
    file: UploadFile = Form(...)
    column_to_schema_mapping: str = Form(...)
    country: str = Form(...)


class UploadImpactPreviewResponse(BaseModel):
    new_schools: int
    schools_to_update: int
    rows_with_school_id: int
    missing_school_id_rows: int
    unique_school_ids: int
    duplicate_school_id_rows: int


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
