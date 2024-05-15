from dataclasses import dataclass
from datetime import datetime

import orjson
from croniter import croniter
from fastapi import Form
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator

from data_ingestion.models.ingest_api_qos import (
    AuthorizationTypeEnum,
    PaginationTypeEnum,
    RequestMethodEnum,
    SendDateInEnum,
    SendQueryInEnum,
)
from data_ingestion.utils.string import is_valid_format_code


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
    date_last_ingested: datetime
    date_last_successfully_ingested: datetime
    date_modified: datetime
    enabled: bool
    error_message: str | None
    page_number_key: str | None
    page_offset_key: str | None
    page_send_query_in: SendQueryInEnum
    page_size_key: str | None
    page_starts_with: int | None
    pagination_type: PaginationTypeEnum
    query_parameters: str | None
    request_body: str | None
    request_method: RequestMethodEnum
    school_id_key: str | None
    size: int | None

    model_config = ConfigDict(from_attributes=True)


class SchoolConnectivitySchema(ApiConfiguration):
    ingestion_frequency: str
    schema_url: str | None
    school_list_id: str
    date_key: str | None
    date_format: str | None
    school_id_send_query_in: SendQueryInEnum
    send_date_in: SendDateInEnum
    response_date_key: str
    response_date_format: str
    has_school_id_giga: bool
    school_id_giga_govt_key: str

    @model_validator(mode="after")
    def validate_date_format(self):
        if self.date_key is not None:
            if self.date_format is None:
                raise ValueError(
                    "date_format should also be provided when date_key is provided"
                )
            if not is_valid_format_code(self.date_format):
                raise ValueError("date_format is invalid")
        return self

    @model_validator(mode="after")
    def validate_ingestion_frequency(self):
        if not croniter.is_valid(self.ingestion_frequency):
            raise ValueError("ingestion_frequency must be a valid cron expression")
        return self


class SchoolListSchema(ApiConfiguration):
    column_to_schema_mapping: dict[str, str]
    name: str
    user_email: EmailStr
    user_id: str
    country: str
    school_connectivity: SchoolConnectivitySchema


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
    error_message: str | None
    page_number_key: str | None
    page_offset_key: str | None
    page_send_query_in: SendQueryInEnum
    page_size_key: str | None
    page_starts_with: int | None
    pagination_type: PaginationTypeEnum
    query_parameters: str | None
    request_body: str | None
    request_method: RequestMethodEnum
    school_id_key: str
    size: int | None


@dataclass
class CreateSchoolListRequest(ApiConfigurationRequest):
    country: str
    column_to_schema_mapping: dict[str, str]
    name: str
    user_email: EmailStr
    user_id: str

    @field_validator("column_to_schema_mapping", mode="before")
    @classmethod
    def validate_column_to_schema_mapping(cls, value: str | dict):
        if isinstance(value, str):
            return orjson.loads(value)
        return value


@dataclass
class CreateSchoolConnectivityRequest(ApiConfigurationRequest):
    ingestion_frequency: str
    date_key: str | None
    date_format: str | None
    school_id_send_query_in: SendQueryInEnum
    send_date_in: SendDateInEnum
    response_date_key: str
    response_date_format: str
    has_school_id_giga: bool
    school_id_giga_govt_key: str


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


class EditSchoolConnectivityRequest(ApiConfigurationRequest):
    ingestion_frequency: str
    date_key: str | None
    date_format: str | None
    school_id_send_query_in: SendQueryInEnum
    send_date_in: SendDateInEnum
    response_date_key: str
    response_date_format: str
    has_school_id_giga: bool
    school_id_giga_govt_key: str

    @model_validator(mode="after")
    def validate_date_format(self):
        if self.date_key is not None:
            if self.date_format is None:
                raise ValueError(
                    "date_format should also be provided when date_key is provided"
                )
            if not is_valid_format_code(self.date_format):
                raise ValueError("date_format is invalid")
        return self

    @model_validator(mode="after")
    def validate_ingestion_frequency(self):
        if not croniter.is_valid(self.ingestion_frequency):
            raise ValueError("ingestion_frequency must be a valid cron expression")
        return self


class EditSchoolListRequest(ApiConfigurationRequest):
    column_to_schema_mapping: dict[str, str]
    name: str
    user_email: EmailStr
    user_id: str
    country: str

    @field_validator("column_to_schema_mapping", mode="before")
    @classmethod
    def validate_column_to_schema_mapping(cls, value: str | dict):
        if isinstance(value, str):
            return orjson.loads(value)
        return value


class EditApiIngestionRequest(BaseModel):
    school_connectivity: EditSchoolConnectivityRequest
    school_list: EditSchoolListRequest


class CreateApiIngestionResponse(BaseModel):
    school_list: SchoolListSchema
    school_connectivity: SchoolConnectivitySchema


class UpdateSchoolListErrorMessageRequest(BaseModel):
    id: str
    error_message: str
