from datetime import datetime

from pydantic import BaseModel

from data_ingestion.models.file_upload import DQStatusEnum


class SchoolRegistrationTriggerRequest(BaseModel):
    giga_id_school: str
    school_id: str
    school_name: str
    latitude: float
    longitude: float
    country_iso3_code: str
    education_level: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    verification_status: str | None = (
        None  # Status from NocoDB: "verified", "rejected", "unverified"
    )


class SchoolRegistrationTriggerResponse(BaseModel):
    id: str
    giga_id_school: str
    dq_status: DQStatusEnum
    created: datetime


class NocoDBSchoolRecord(BaseModel):
    """Schema for a single school record from NocoDB."""

    model_config = {"extra": "allow"}

    Id: int | None = None
    CreatedAt: str | None = None
    UpdatedAt: str | None = None
    giga_id_school: str | None = None
    school_id: str | None = None
    school_name: str | None = None
    latitude: float | str | None = None
    longitude: float | str | None = None
    country_iso3_code: str | None = None
    education_level: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    verification_status: str | None = None
    created_on: str | None = None
    rejected_on: str | None = None
    status: str | None = None
    rejection_reason: str | None = None


class NocoDBWebhookData(BaseModel):
    """Schema for NocoDB webhook data payload."""

    table_id: str
    table_name: str
    previous_rows: list[NocoDBSchoolRecord]
    rows: list[NocoDBSchoolRecord]


class NocoDBWebhookPayload(BaseModel):
    """Schema for NocoDB webhook payload."""

    type: str
    id: str
    base_id: str
    version: str
    data: NocoDBWebhookData
