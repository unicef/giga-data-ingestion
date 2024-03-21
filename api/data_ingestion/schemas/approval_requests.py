from pydantic import AwareDatetime, BaseModel, constr


class ApprovalRequestListing(BaseModel):
    country: str
    country_iso3: constr(min_length=3, max_length=3)
    dataset: str
    subpath: str
    last_modified: AwareDatetime
    rows_count: int
    rows_added: int
    rows_updated: int
    rows_deleted: int


class UploadApprovedRowsRequest(BaseModel):
    approved_rows: list[str]
    subpath: str
