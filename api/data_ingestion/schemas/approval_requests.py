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


class UploadApprovedRowsRequest(BaseModel):
    approved_rows: list[str]
    subpath: str
    dq_mode: str = "uploaded"


class ApprovalRequestAuditLogSchema(BaseModel):
    approval_request_id: str
    approved_by_id: UUID4
    approved_by_email: str
    approved_date: datetime
    dq_mode: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ApprovalRequestSchema(BaseModel):
    country: constr(min_length=3, max_length=3)
    dataset: str
    enabled: bool
    is_merge_processing: bool
    audit_logs: list[ApprovalRequestAuditLogSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ApproveDatasetRequest(BaseModel):
    upload_id: str
    dq_mode: str
