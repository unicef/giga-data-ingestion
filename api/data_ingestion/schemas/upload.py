from datetime import datetime
from typing import Generic, TypeVar

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
    upload_path: str

    model_config = ConfigDict(from_attributes=True)


DataT = TypeVar("DataT")


class PagedResponseSchema(BaseModel, Generic[DataT]):
    data: list[DataT]
    page_index: int
    per_page: int
    total_items: int
    total_pages: int
