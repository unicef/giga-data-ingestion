from dataclasses import dataclass
from datetime import datetime

import orjson
from fastapi import Form, UploadFile
from pydantic import UUID4, BaseModel, ConfigDict, EmailStr, constr, field_validator


class FileUpload(BaseModel):
    id: str
    created: datetime
    uploader_id: UUID4
    uploader_email: EmailStr
    dq_report_path: str | None
    country: constr(min_length=3, max_length=3)
    dataset: str
    source: str | None
    original_filename: str
    column_to_schema_mapping: dict[str, str]
    column_license: dict[str, str]
    upload_path: str

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


@dataclass
class FileUploadRequest:
    file: UploadFile = Form(...)
    column_to_schema_mapping: str = Form(...)
    column_license: str = Form(...)
    country: str = Form(...)
    dataset: str = Form(...)
    metadata: str = Form(...)
    source: str | None = Form(None)


@dataclass
class UnstructuredFileUploadRequest:
    file: UploadFile = Form(...)
    country: str = Form(...)
    metadata: str = Form(...)
    source: str | None = Form(None)
