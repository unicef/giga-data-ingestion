import logging
from datetime import datetime
from typing import Annotated

import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from azure.core.exceptions import HttpResponseError
from data_ingestion.db.primary import get_db
from data_ingestion.internal.school_registration import write_registration_csv_to_adls
from data_ingestion.models import FileUpload
from data_ingestion.models.file_upload import DQStatusEnum
from data_ingestion.settings import settings
from data_ingestion.utils.data_quality import get_metadata_path

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/school-registration",
    tags=["school-registration"],
)

meter_auth = HTTPBearer(scheme_name="GigaMeter Bearer")


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

    # Use model_config to allow extra fields from NocoDB
    model_config = {"extra": "allow"}

    # Only define required fields that we need
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
    version: str
    data: NocoDBWebhookData


def verify_meter_token(
    credentials: HTTPAuthorizationCredentials,
) -> None:
    """Validate the bearer token from GigaMeter against the configured secret."""
    if credentials.credentials != settings.GIGAMETER_API_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def verify_nocodb_token(
    credentials: HTTPAuthorizationCredentials,
) -> None:
    """Validate the bearer token from NocoDB against the configured secret."""
    if credentials.credentials != settings.NOCODB_INBOUND_API_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def build_column_mapping(payload: SchoolRegistrationTriggerRequest | dict) -> dict:
    """
    Build identity column mapping for FileUpload
    """
    return {
        "school_id_giga": "school_id_giga",
        "school_id_govt": "school_id_govt",
        "school_name": "school_name",
        "latitude": "latitude",
        "longitude": "longitude",
        "education_level": "education_level",
        "contact_name": "contact_name",
        "contact_email": "contact_email",
        "verification_status": "verification_status",
    }


def build_registration_metadata(
    payload: SchoolRegistrationTriggerRequest,
) -> dict:
    """Build registration-specific metadata (not for column mapping)."""

    verification_status = (
        payload.verification_status if payload.verification_status else "unverified"
    )

    return {
        "giga_id_school": payload.giga_id_school,
        "school_id": payload.school_id,
        "registration_id": getattr(payload, "registration_id", payload.giga_id_school),
        "school_name": payload.school_name,
        "latitude": str(payload.latitude) if payload.latitude else "",
        "longitude": str(payload.longitude) if payload.longitude else "",
        "education_level": payload.education_level or "",
        "contact_name": payload.contact_name or "",
        "contact_email": str(payload.contact_email) if payload.contact_email else "",
        "verification_status": verification_status,
    }


@router.post(
    "/trigger",
    status_code=status.HTTP_201_CREATED,
    response_model=SchoolRegistrationTriggerResponse,
)
async def trigger_registration_pipeline(
    payload: NocoDBWebhookPayload,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(meter_auth)],
    db: AsyncSession = Depends(get_db),
):
    """
    Called by GigaMeter to initiate the DQ pipeline for a new school registration.
    Creates a FileUpload record and writes a single-row CSV to ADLS.
    """
    # verify_meter_token(credentials)

    country_code = coco.convert(payload.country_iso3_code, to="ISO3")
    if country_code == "not found":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid country: {payload.country}",
        )

    existing = await db.scalar(
        select(FileUpload)
        .where(
            FileUpload.original_filename == f"{payload.giga_id_school}.csv",
            FileUpload.source == "gigameter",
        )
        .order_by(FileUpload.created.desc())
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"An active registration for giga_id_school="
                f"{payload.giga_id_school} already exists (id={existing.id})."
            ),
        )

    file_upload = FileUpload(
        uploader_id=settings.SYSTEM_USER_ID,
        uploader_email=settings.SYSTEM_USER_EMAIL,
        country=country_code,
        dataset="geolocation",
        source="gigameter",
        original_filename=f"{payload.giga_id_school}.csv",
        column_to_schema_mapping=build_column_mapping(payload.model_dump()),
        column_license={},
    )

    db.add(file_upload)
    await db.commit()
    await db.refresh(file_upload)

    file_upload.metadata_json_path = get_metadata_path(file_upload.upload_path)
    db.add(file_upload)
    await db.commit()
    await db.refresh(file_upload)

    try:
        registration_metadata = build_registration_metadata(payload)
        write_registration_csv_to_adls(
            payload.model_dump(),
            file_upload,
            registration_metadata,
            mode="create",
        )
    except HttpResponseError as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == file_upload.id))
        await db.commit()
        raise HTTPException(
            detail=err.message, status_code=err.response.status_code
        ) from err
    except Exception as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == file_upload.id))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to write registration file to storage.",
        ) from err

    return SchoolRegistrationTriggerResponse(
        id=file_upload.id,
        giga_id_school=payload.giga_id_school,
        dq_status=file_upload.dq_status,
        created=file_upload.created,
    )


@router.post(
    "/re-trigger",
    status_code=status.HTTP_202_ACCEPTED,
)
async def retrigger_registration_pipeline(
    payload: SchoolRegistrationTriggerRequest,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(meter_auth)],
    db: AsyncSession = Depends(get_db),
):
    """
    Called by NocoDB webhook when a government verifier updates school data.
    Creates a new FileUpload record so the Dagster sensor detects the re-trigger.
    """
    verify_nocodb_token(credentials)

    if not payload.data.rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rows found in webhook payload",
        )

    updated_record = payload.data.rows[0]

    giga_id = getattr(updated_record, "giga_id_school", None)
    if not giga_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: giga_id_school",
        )
    try:
        # Parse latitude and longitude as floats, handling both string and numeric types
        latitude = 0.0
        longitude = 0.0

        lat_value = getattr(updated_record, "latitude", None)
        lon_value = getattr(updated_record, "longitude", None)

        if lat_value:
            latitude = float(lat_value)
        if lon_value:
            longitude = float(lon_value)

    except (ValueError, TypeError) as e:
        logger.error(
            f"Invalid coordinate format: lat={lat_value}, lon={lon_value}, error={e}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid latitude or longitude format: {str(e)}",
        ) from e

    school_data = SchoolRegistrationTriggerRequest(
        giga_id_school=giga_id,
        school_id=getattr(updated_record, "school_id", None) or "",
        school_name=getattr(updated_record, "school_name", None) or "",
        latitude=latitude,
        longitude=longitude,
        country_iso3_code=getattr(updated_record, "country_iso3_code", None) or "",
        education_level=getattr(updated_record, "education_level", None),
        contact_name=getattr(updated_record, "contact_name", None),
        contact_email=getattr(updated_record, "contact_email", None),
        verification_status=getattr(updated_record, "verification_status", None)
        or "unverified",
    )

    existing = await db.scalar(
        select(FileUpload)
        .where(
            FileUpload.original_filename == f"{school_data.giga_id_school}.csv",
        )
        .order_by(FileUpload.created.desc())
    )
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No registration found for giga_id_school={school_data.giga_id_school}",
        )

    country_code = coco.convert(school_data.country_iso3_code, to="ISO3")
    if country_code == "not found":
        country_code = existing.country

    new_file_upload = FileUpload(
        uploader_id=existing.uploader_id,
        uploader_email=existing.uploader_email,
        country=country_code,
        dataset="geolocation",
        source="nocodb",
        original_filename=f"{school_data.giga_id_school}.csv",
        column_to_schema_mapping=build_column_mapping(school_data.model_dump()),
        column_license={},
    )

    db.add(new_file_upload)
    await db.commit()
    await db.refresh(new_file_upload)

    new_file_upload.metadata_json_path = get_metadata_path(new_file_upload.upload_path)
    db.add(new_file_upload)
    await db.commit()
    await db.refresh(new_file_upload)

    try:
        registration_metadata = build_registration_metadata(school_data)
        write_registration_csv_to_adls(
            school_data.model_dump(),
            new_file_upload,
            registration_metadata,
            mode="update",
        )
    except Exception as err:
        logger.error(
            f"Failed to write registration file for {school_data.giga_id_school}: {err}"
        )
        await db.execute(delete(FileUpload).where(FileUpload.id == new_file_upload.id))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write registration file to storage: {str(err)}",
        ) from err

    return {
        "message": "Re-trigger initiated successfully.",
        "file_upload_id": new_file_upload.id,
        "giga_id_school": school_data.giga_id_school,
        "verification_status": school_data.verification_status,
    }
