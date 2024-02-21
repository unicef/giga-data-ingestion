from datetime import datetime

from pydantic import EmailStr
from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import BaseModel


class SchoolList(BaseModel):
    __tablename__ = "qos_school_list"

    request_method: Mapped[str] = mapped_column(
        Enum("POST", "GET", name="request_method_enum"), nullable=False
    )
    api_endpoint: Mapped[str] = mapped_column(String(), nullable=False)
    data_key: Mapped[str] = mapped_column(String())
    school_id_key: Mapped[str] = mapped_column(String(), nullable=False)

    query_parameters: Mapped[str] = mapped_column(String())
    request_body: Mapped[str] = mapped_column(String())
    authorization_type: Mapped[str] = mapped_column(
        Enum("BEARER_TOKEN", "BASIC_AUTH", "API_KEY", name="authorization_type_enum")
    )
    bearer_auth_bearer_token: Mapped[str] = mapped_column(String())
    basic_auth_username: Mapped[str] = mapped_column(String())
    basic_auth_password: Mapped[str] = mapped_column(String())
    api_auth_api_key: Mapped[str] = mapped_column(String())
    api_auth_api_value: Mapped[str] = mapped_column(String())

    pagination_type: Mapped[str] = mapped_column(
        Enum("PAGE_NUMBER", "LIMIT_OFFSET", name="pagination_type_enum")
    )
    size: Mapped[int] = mapped_column(Integer())
    page_size_key: Mapped[str] = mapped_column(String())
    send_query_in: Mapped[str] = mapped_column(
        Enum("BODY", "QUERY_PARAMETERS", "HEADERS", name="send_query_in_enum")
    )

    page_number_key: Mapped[str] = mapped_column(String())
    page_starts_with: Mapped[int] = mapped_column(Integer())
    page_offset_key: Mapped[str] = mapped_column(String())
    enabled: Mapped[bool] = mapped_column(Boolean(), default=True)

    date_created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )
    date_modified: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )
    user_id: Mapped[str] = mapped_column(String())
    user_email: Mapped[EmailStr] = mapped_column(String())
