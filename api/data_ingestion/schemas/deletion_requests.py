from datetime import datetime
from typing import Literal

from pydantic import UUID4, BaseModel, Field

DeleteType = Literal["specific", "all"]


class DeleteRowsRequest(BaseModel):
    country: str
    delete_type: DeleteType = "specific"
    ids: list[str] = Field(default_factory=list)
    id_type: Literal["school_id_giga", "school_id_govt"] = "school_id_giga"
    original_filename: str = ""
    school_count_override: int | None = Field(default=None, ge=0)


class DeleteRowsSchema(BaseModel):
    filename: str


class PreviewDeleteRowsRequest(BaseModel):
    country: str
    delete_type: DeleteType = "specific"
    ids: list[str] = Field(default_factory=list)
    id_type: Literal["school_id_giga", "school_id_govt"] = "school_id_giga"


class PreviewDeleteRowsResponse(BaseModel):
    school_count: int | None = None
    check_skipped: bool = False


class DeleteRows(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    requested_by_id: UUID4
    requested_by_email: str
    requested_date: datetime
    country: str
    original_filename: str | None = None
    id_type: str | None = None
    school_count: int | None = None
    file_path: str | None = None
    raw_file_path: str | None = None
    is_delete_all: bool | None = None
    status: str | None = None
