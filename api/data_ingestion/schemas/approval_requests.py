from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, conint, constr


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


class CDFSelection(BaseModel):
    school_id_giga: str
    _change_type: Literal["insert", "update_preimage", "update_postimage", "delete"]
    _commit_version: conint(ge=0)


class UploadApprovedRowsRequest(BaseModel):
    approved_rows: Literal["__all__"] | list[CDFSelection]
    subpath: str


class ApprovalRequestSchema(BaseModel):
    country: constr(min_length=3, max_length=3)
    dataset: str
    enabled: bool

    model_config = ConfigDict(from_attributes=True)
