import enum
from datetime import datetime

from pydantic import EmailStr
from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
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


class ApiConfiguration(BaseModel):
    __abstract__ = True

    api_auth_api_key: Mapped[str] = mapped_column(nullable=True)
    api_auth_api_value: Mapped[str] = mapped_column(nullable=True)
    api_endpoint: Mapped[str] = mapped_column(nullable=False)
    authorization_type: Mapped[AuthorizationTypeEnum] = mapped_column(
        Enum(AuthorizationTypeEnum), default=AuthorizationTypeEnum.NONE, nullable=False
    )
    basic_auth_password: Mapped[str] = mapped_column(nullable=True)
    basic_auth_username: Mapped[str] = mapped_column(nullable=True)
    bearer_auth_bearer_token: Mapped[str] = mapped_column(nullable=True)

    data_key: Mapped[str] = mapped_column(nullable=True)
    date_created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    date_modified: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    enabled: Mapped[bool] = mapped_column(default=True)

    page_number_key: Mapped[str] = mapped_column(nullable=True)
    page_offset_key: Mapped[str] = mapped_column(nullable=True)
    page_size_key: Mapped[str] = mapped_column(nullable=True)
    page_starts_with: Mapped[int] = mapped_column(nullable=True)
    pagination_type: Mapped[PaginationTypeEnum] = mapped_column(
        Enum(PaginationTypeEnum), default=PaginationTypeEnum.NONE, nullable=False
    )

    query_parameters: Mapped[str] = mapped_column(nullable=True)
    request_body: Mapped[str] = mapped_column(nullable=True)
    request_method: Mapped[RequestMethodEnum] = mapped_column(
        Enum(RequestMethodEnum), default=RequestMethodEnum.GET, nullable=False
    )
    school_id_key: Mapped[str] = mapped_column(nullable=False)
    send_query_in: Mapped[SendQueryInEnum] = mapped_column(
        Enum(SendQueryInEnum), default=SendQueryInEnum.NONE, nullable=False
    )
    size: Mapped[int] = mapped_column(nullable=True)
    status: Mapped[bool] = mapped_column(default=False)


class SchoolList(ApiConfiguration):
    __tablename__ = "qos_school_list"

    name: Mapped[str] = mapped_column(nullable=False, server_default="")
    column_to_schema_mapping: Mapped[str] = mapped_column(
        nullable=False, server_default=""
    )
    user_email: Mapped[EmailStr] = mapped_column(String(), nullable=False)
    user_id: Mapped[str] = mapped_column(nullable=False)

    school_connectivity: Mapped["SchoolConnectivity"] = relationship(
        "SchoolConnectivity", back_populates="school_list"
    )


class SchoolConnectivity(ApiConfiguration):
    __tablename__ = "qos_school_connectivity"

    schema_url: Mapped[str] = mapped_column()
    ingestion_frequency: Mapped[int] = mapped_column()

    school_list_id: Mapped[str] = mapped_column(ForeignKey("qos_school_list.id"))
    school_list: Mapped["SchoolList"] = relationship(
        "SchoolList", back_populates="school_connectivity"
    )
