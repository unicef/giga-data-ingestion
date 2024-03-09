from dataclasses import dataclass
from datetime import datetime

from fastapi import Form
from pydantic import BaseModel, ConfigDict, EmailStr

from data_ingestion.models.ingest_api_qos import (
    AuthorizationTypeEnum,
    PaginationTypeEnum,
    RequestMethodEnum,
    SendQueryInEnum,
)


class ApiConfiguration(BaseModel):
    id: str
    api_auth_api_key: str | None
    api_auth_api_value: str | None
    api_endpoint: str
    authorization_type: AuthorizationTypeEnum
    basic_auth_password: str | None
    basic_auth_username: str | None
    bearer_auth_bearer_token: str | None
    data_key: str
    date_created: datetime
    date_modified: datetime
    enabled: bool
    page_number_key: str | None
    page_offset_key: str | None
    page_size_key: str | None
    page_starts_with: int | None
    pagination_type: PaginationTypeEnum
    query_parameters: str | None
    request_body: str | None
    request_method: RequestMethodEnum
    school_id_key: str
    send_query_in: SendQueryInEnum
    size: int | None


class SchoolListSchema(ApiConfiguration):
    column_to_schema_mapping: str
    name: str
    user_email: EmailStr
    user_id: str

    model_config = ConfigDict(from_attributes=True)


class SchoolConnectivitySchema(ApiConfiguration):
    ingestion_frequency: int
    schema_url: str
    school_list_id: str

    model_config = ConfigDict(from_attributes=True)


class ApiConfigurationRequest(BaseModel):
    api_auth_api_key: str | None
    api_auth_api_value: str | None
    api_endpoint: str
    authorization_type: AuthorizationTypeEnum
    basic_auth_password: str | None
    basic_auth_username: str | None
    bearer_auth_bearer_token: str | None
    data_key: str
    enabled: bool
    page_number_key: str | None
    page_offset_key: str | None
    page_size_key: str | None
    page_starts_with: int | None
    pagination_type: PaginationTypeEnum
    query_parameters: str | None
    request_body: str | None
    request_method: RequestMethodEnum
    school_id_key: str
    send_query_in: SendQueryInEnum
    size: int | None


@dataclass
class CreateSchoolListRequest(ApiConfigurationRequest):
    column_to_schema_mapping: str
    name: str
    user_email: EmailStr
    user_id: str


@dataclass
class CreateSchoolConnectivityRequest(ApiConfigurationRequest):
    ingestion_frequency: int


@dataclass
class CreateApiIngestionRequest:
    school_connectivity: str = Form(...)
    school_list: str = Form(...)

    def get_school_connectivity_model(
        self,
    ) -> CreateSchoolConnectivityRequest:
        return CreateSchoolConnectivityRequest.model_validate_json(
            self.school_connectivity
        )

    def get_school_list_model(
        self,
    ) -> CreateSchoolListRequest:
        return CreateSchoolListRequest.model_validate_json(self.school_list)