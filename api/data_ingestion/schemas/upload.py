from dataclasses import dataclass
from datetime import datetime

from fastapi import Form, UploadFile
from pydantic import UUID4, BaseModel, ConfigDict, EmailStr, constr


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


@dataclass
class FileUploadRequest:
    file: UploadFile = Form(...)
    column_to_schema_mapping: str = Form(...)
    column_license: str = Form(...)
    country: str = Form(...)
    dataset: str = Form(...)
    metadata: str = Form(...)
    source: str | None = Form(None)
