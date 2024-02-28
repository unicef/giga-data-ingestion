import enum
from datetime import datetime

from pydantic import EmailStr
from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import BaseModel


class AuthorizationTypeEnum(enum.Enum):
    BEARER_TOKEN = "BEARER_TOKEN"
    BASIC_AUTH = "BASIC_AUTH"
    API_KEY = "API_KEY"
    NONE = "NONE"


class PaginationTypeEnum(enum.Enum):
    PAGE_NUMBER = "PAGE_NUMBER"
    LIMIT_OFFSET = "LIMIT_OFFSET"
    NONE = "NONE"


class RequestMethodEnum(enum.Enum):
    POST = "POST"
    GET = "GET"


class SendQueryInEnum(enum.Enum):
    BODY = "BODY"
    QUERY_PARAMETERS = "QUERY_PARAMETERS"
    NONE = "NONE"


class SchoolList(BaseModel):
    __tablename__ = "qos_school_list"

    request_method: Mapped[RequestMethodEnum] = mapped_column(
        Enum(RequestMethodEnum), default=RequestMethodEnum.GET, nullable=False
    )
    api_endpoint: Mapped[str] = mapped_column(nullable=False)
    data_key: Mapped[str] = mapped_column()
    school_id_key: Mapped[str] = mapped_column(nullable=False)

    query_parameters: Mapped[str] = mapped_column()
    request_body: Mapped[str] = mapped_column()
    authorization_type: Mapped[AuthorizationTypeEnum] = mapped_column(
        Enum(AuthorizationTypeEnum), default=AuthorizationTypeEnum.NONE, nullable=False
    )
    bearer_auth_bearer_token: Mapped[str] = mapped_column()
    basic_auth_username: Mapped[str] = mapped_column()
    basic_auth_password: Mapped[str] = mapped_column()
    api_auth_api_key: Mapped[str] = mapped_column()
    api_auth_api_value: Mapped[str] = mapped_column()

    pagination_type: Mapped[PaginationTypeEnum] = mapped_column(
        Enum(PaginationTypeEnum), default=PaginationTypeEnum.NONE, nullable=False
    )
    size: Mapped[int] = mapped_column()
    page_size_key: Mapped[str] = mapped_column()
    send_query_in: Mapped[SendQueryInEnum] = mapped_column(
        Enum(SendQueryInEnum), default=SendQueryInEnum.NONE, nullable=False
    )

    page_number_key: Mapped[str] = mapped_column()
    page_starts_with: Mapped[int] = mapped_column()
    page_offset_key: Mapped[str] = mapped_column()
    enabled: Mapped[bool] = mapped_column(default=True)

    date_created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    date_modified: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    user_id: Mapped[str] = mapped_column()
    user_email: Mapped[EmailStr] = mapped_column(String())
    status: Mapped[bool] = mapped_column(default=False)
    name: Mapped[str] = mapped_column(nullable=False, server_default="")
