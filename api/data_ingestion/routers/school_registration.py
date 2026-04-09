import logging
from datetime import datetime
from typing import Annotated

import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
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
    contact_email: EmailStr | None = None


class SchoolRegistrationTriggerResponse(BaseModel):
    id: str
    giga_id_school: str
    dq_status: DQStatusEnum
    created: datetime


def _verify_meter_token(
    credentials: HTTPAuthorizationCredentials,
) -> None:
    """Validate the bearer token from GigaMeter against the configured secret."""
    if credentials.credentials != settings.GIGAMETER_API_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def _verify_nocodb_token(
    credentials: HTTPAuthorizationCredentials,
) -> None:
    """Validate the bearer token from NocoDB against the configured secret."""
    if credentials.credentials != settings.NOCODB_INBOUND_API_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def _build_column_mapping() -> dict:
    """
    Build identity column mapping for school registration CSV.
    Since the CSV already has correct schema column names, we map each column to itself.
    """
    return {
        "school_id_giga": "school_id_giga",
        "school_id_govt": "school_id_govt",
        "school_name": "school_name",
        "latitude": "latitude",
        "longitude": "longitude",
        "education_level": "education_level",
    }


def _build_registration_metadata(
    payload: SchoolRegistrationTriggerRequest,
) -> dict:
    """Build registration-specific metadata (not for column mapping)."""
    return {
        "giga_id_school": payload.giga_id_school,
        "school_id": payload.school_id,
        "registration_id": getattr(payload, "registration_id", payload.giga_id_school),
        "contact_name": payload.contact_name or "",
        "contact_email": str(payload.contact_email) if payload.contact_email else "",
    }


@router.post(
    "/trigger",
    status_code=status.HTTP_201_CREATED,
    response_model=SchoolRegistrationTriggerResponse,
)
async def trigger_registration_pipeline(
    payload: SchoolRegistrationTriggerRequest,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(meter_auth)],
    db: AsyncSession = Depends(get_db),
):
    """
    Called by GigaMeter to initiate the DQ pipeline for a new school registration.
    Creates a FileUpload record and writes a single-row CSV to ADLS.
    """
    _verify_meter_token(credentials)

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
        column_to_schema_mapping=_build_column_mapping(),
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
        registration_metadata = _build_registration_metadata(payload)
        write_registration_csv_to_adls(
            payload.model_dump(), file_upload, registration_metadata
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
    Called when a government verifier updates school data or Status from unvarified to varfied or declined.
    Creates a new FileUpload record so the Dagster sensor detects the re-trigger.
    """
    _verify_nocodb_token(credentials)

    existing = await db.scalar(
        select(FileUpload)
        .where(
            FileUpload.original_filename == f"{payload.giga_id_school}.csv",
        )
        .order_by(FileUpload.created.desc())
    )
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No registration found for giga_id_school={payload.giga_id_school}",
        )

    country_code = coco.convert(payload.country_iso3_code, to="ISO3")
    if country_code == "not found":
        country_code = existing.country

    new_file_upload = FileUpload(
        uploader_id=existing.uploader_id,
        uploader_email=existing.uploader_email,
        country=country_code,
        dataset="geolocation",
        source="nocodb",
        original_filename=f"{payload.giga_id_school}.csv",
        column_to_schema_mapping=_build_column_mapping(),
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
        registration_metadata = _build_registration_metadata(payload)
        write_registration_csv_to_adls(
            payload.model_dump(), new_file_upload, registration_metadata
        )
    except Exception as err:
        await db.execute(delete(FileUpload).where(FileUpload.id == new_file_upload.id))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to write registration file to storage.",
        ) from err

    return {
        "message": "Re-trigger initiated successfully.",
        "file_upload_id": new_file_upload.id,
    }
