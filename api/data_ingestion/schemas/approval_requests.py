from pydantic import AwareDatetime, BaseModel, constr


class ApprovalRequestListing(BaseModel):
    country: str
    country_iso3: constr(min_length=3, max_length=3)
    dataset: str
    last_modified: AwareDatetime
    rows_added: int
    rows_updated: int
    rows_deleted: int
