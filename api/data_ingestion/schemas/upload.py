from datetime import datetime

from pydantic import UUID4, BaseModel, EmailStr, constr


class FileUpload(BaseModel):
    id: str
    created: datetime
    uploader_id: UUID4
    uploader_email: EmailStr
    dq_report_path: str
    country: constr(min_length=3, max_length=3)
    dataset: str
    source: str | None
    original_filename: str
    upload_path: str
