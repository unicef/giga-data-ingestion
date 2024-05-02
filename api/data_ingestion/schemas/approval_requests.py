from pydantic import AwareDatetime, BaseModel, ConfigDict, constr


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


class ApprovalRequestSchema(BaseModel):
    country: constr(min_length=3, max_length=3)
    dataset: str
    enabled: bool

    model_config = ConfigDict(from_attributes=True)
