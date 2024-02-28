from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from data_ingestion.models.school_list import (
    AuthorizationTypeEnum,
    PaginationTypeEnum,
    RequestMethodEnum,
    SendQueryInEnum,
)


class SchoolListSchema(BaseModel):
    id: str
    request_method: RequestMethodEnum
    api_endpoint: str
    data_key: str
    school_id_key: str

    query_parameters: str
    request_body: str
    authorization_type: AuthorizationTypeEnum

    bearer_auth_bearer_token: str | None
    basic_auth_username: str | None
    basic_auth_password: str | None
    api_auth_api_key: str | None
    api_auth_api_value: str | None

    pagination_type: PaginationTypeEnum
    size: int
    page_size_key: str
    send_query_in: SendQueryInEnum

    page_number_key: str
    page_starts_with: int
    page_offset_key: str
    enabled: bool
    date_created: datetime
    date_modified: datetime
    user_id: str
    user_email: EmailStr
    status: bool

    name: str

    model_config = ConfigDict(from_attributes=True)
