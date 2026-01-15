from datetime import datetime

from pydantic import UUID4, AwareDatetime, BaseModel, ConfigDict, Field, constr


class ApprovalRequestListing(BaseModel):
    id: str
    country: str
    country_iso3: constr(min_length=3, max_length=3)
    dataset: str
    subpath: str
    last_modified: AwareDatetime
    rows_count: int
    rows_added: int
    rows_updated: int
    rows_deleted: int
    enabled: bool
    upload_id: str
    uploaded_at: datetime | None
    file_name: str | None


class UploadApprovedRowsRequest(BaseModel):
    approved_rows: list[str]
    subpath: str
    upload_id: str


class ApprovalRequestAuditLogSchema(BaseModel):
    approval_request_id: str
    approved_by_id: UUID4
    approved_by_email: str
    approved_date: datetime

    model_config = ConfigDict(from_attributes=True)


class ApprovalRequestSchema(BaseModel):
    country: constr(min_length=3, max_length=3)
    dataset: str
    enabled: bool
    is_merge_processing: bool
    audit_logs: list[ApprovalRequestAuditLogSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ApprovalFilterByUploadRequest(BaseModel):
    upload_ids: list[str]


class ApprovalByUploadResponse(BaseModel):
    id: str
    country: str
    dataset: str
    upload_id: str
    enabled: bool
