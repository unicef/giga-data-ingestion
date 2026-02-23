from pydantic import BaseModel, ConfigDict


class FuzzyMismatchRecord(BaseModel):
    file_upload_id: str
    row_index: int | None
    school_id_govt: str | None
    column_name: str
    original_value: str | None
    suggested_value: str | None
    match_score: float
    is_accepted: bool | None
    final_value: str | None
    created_at: str | None  # Using str for datetime serialization simplicity

    model_config = ConfigDict(from_attributes=True)


class FuzzyCorrectionItem(BaseModel):
    school_id_govt: str
    column_name: str
    final_value: str


class FuzzyCorrectionRequest(BaseModel):
    corrections: list[FuzzyCorrectionItem]
