import logging
import secrets
from typing import Annotated

import country_converter as coco
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from azure.core.exceptions import HttpResponseError
from data_ingestion.db.primary import get_db
from data_ingestion.internal.school_registration import (
    build_registration_metadata,
    call_meter_soft_delete,
    create_school_registration_file_upload,
    write_registration_csv_to_adls,
)
from data_ingestion.models import DeletionRequest, FileUpload
from data_ingestion.routers.approval_requests import reject_pending_upload_row
from data_ingestion.routers.deletion_requests import create_deletion_request
from data_ingestion.schemas.school_registration import (
    NocoDBWebhookPayload,
    SchoolRegistrationTriggerRequest,
    SchoolRegistrationTriggerResponse,
)
from data_ingestion.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/school-registration",
    tags=["school-registration"],
)

bearer_auth = HTTPBearer(scheme_name="Bearer Auth")


def verify_meter_token(
    credentials: HTTPAuthorizationCredentials,
) -> None:
    """Validate the bearer token from GigaMeter against the configured secret."""
    if not secrets.compare_digest(
        credentials.credentials, settings.GIGAMETER_API_TOKEN
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def verify_nocodb_token(
    credentials: HTTPAuthorizationCredentials,
) -> None:
    """Validate the bearer token from NocoDB against the configured secret."""
    if not secrets.compare_digest(
        credentials.credentials, settings.NOCODB_INBOUND_API_TOKEN
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@router.post(
    "/trigger",
    status_code=status.HTTP_201_CREATED,
    response_model=SchoolRegistrationTriggerResponse,
)
async def trigger_registration_pipeline(
    payload: SchoolRegistrationTriggerRequest,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_auth)],
    db: AsyncSession = Depends(get_db),
):
    """
    Called by GigaMeter to initiate the DQ pipeline for a new school registration.
    Creates a FileUpload record and writes a single-row CSV to ADLS.
    """
    verify_meter_token(credentials)

    country_code = coco.convert(payload.country_iso3_code, to="ISO3")
    if country_code == "not found":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid country: {payload.country_iso3_code}",
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

    file_upload = await create_school_registration_file_upload(
        db,
        uploader_id=settings.SYSTEM_USER_ID,
        uploader_email=settings.SYSTEM_USER_EMAIL,
        country=country_code,
        source="gigameter",
        giga_id_school=payload.giga_id_school,
    )

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
    payload: NocoDBWebhookPayload,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_auth)],
    db: AsyncSession = Depends(get_db),
):
    """
    Called by NocoDB when a government verifier changes verification_status.

    Verified records create a NocoDB FileUpload update so the DQ pipeline reruns.
    Rejected records either reject the pending GigaMeter approval upload, or create
    a deletion request when the school has already been approved into master data.
    """
    verify_nocodb_token(credentials)

    if not payload.data.rows:
        logger.warning(f"No rows found in webhook payload: {payload.model_dump()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "No rows found in webhook payload",
                "received_payload": payload.model_dump(),
            },
        )

    updated_record = payload.data.rows[0]
    logger.info(f"Updated record from webhook: {updated_record.model_dump_json()}")

    giga_id = getattr(updated_record, "giga_id_school", None)
    if not giga_id:
        logger.warning(
            f"Missing required field: giga_id_school. Record: {updated_record}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Missing required field: giga_id_school",
                "received_record": updated_record.model_dump(),
            },
        )

    # NocoDB should call this API only once per giga_id_school, as we don't want multiple pipeline runs.
    file_upload_nocodb = await db.scalar(
        select(FileUpload)
        .where(
            FileUpload.original_filename == f"{giga_id}.csv",
            FileUpload.source == "nocodb",
        )
        .order_by(FileUpload.created.desc())
    )
    if file_upload_nocodb is not None:
        logger.warning(f"Duplicate re-trigger request for giga_id_school={giga_id}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"A re-trigger for giga_id_school={giga_id} already exists "
                f"(id={file_upload_nocodb.id})."
            ),
        )

    deletion_request = await db.scalar(
        select(DeletionRequest)
        .where(DeletionRequest.original_filename == f"{giga_id}.csv")
        .order_by(DeletionRequest.requested_date.desc())
    )
    if deletion_request is not None:
        logger.warning(
            f"Duplicate delete re-trigger request for giga_id_school={giga_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"A delete re-trigger for giga_id_school={giga_id} already exists "
                f"(id={deletion_request.id})."
            ),
        )

    # Check if a previous registration exists for this giga_id_school from GigaMeter
    existing = await db.scalar(
        select(FileUpload)
        .where(
            FileUpload.original_filename == f"{giga_id}.csv",
            FileUpload.source == "gigameter",
        )
        .order_by(FileUpload.created.desc())
    )
    if existing is None:
        logger.warning(f"No registration found for giga_id_school={giga_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No registration found for giga_id_school={giga_id}",
        )

    verification_status = (
        getattr(updated_record, "verification_status", None) or "unverified"
    ).lower()

    if verification_status == "rejected":
        # Case 1: Already Rejected by Admin
        if existing.approval_status == "REJECTED":
            logger.warning(
                f"Registration already rejected for giga_id_school={giga_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Registration already rejected for giga_id_school={giga_id}",
            )
        # Case 2: Not Approved/Rejected Yet from Approval Page,
        if existing.approval_status != "APPROVED":
            rejection_result = await reject_pending_upload_row(
                db,
                file_upload=existing,
                country_code=existing.country,
                school_id_giga=giga_id,
            )

            response_data = {
                "message": "Pending registration rejected successfully.",
                "file_upload_id": existing.id,
                "giga_id_school": giga_id,
                "rejected_change_ids": rejection_result["rejected_change_ids"],
            }
            call_meter_soft_delete(school_id_giga=giga_id)
            logger.info(f"Pending registration rejected for {giga_id}: {response_data}")
            return response_data
        # Case 3: Already Approved & Synced with Master
        await create_deletion_request(
            db,
            country=existing.country,
            ids=[giga_id],
            id_type="school_id_giga",
            original_filename=f"{giga_id}.csv",
            requested_by_email=existing.uploader_email,
            requested_by_id=existing.uploader_id,
        )

        response_data = {
            "message": "Delete re-trigger initiated successfully.",
            "giga_id_school": giga_id,
        }
        logger.info(
            f"Delete re-trigger completed successfully for {giga_id}: {response_data}"
        )
        return response_data

    school_data = SchoolRegistrationTriggerRequest(
        giga_id_school=giga_id,
        school_id=getattr(updated_record, "school_id", None) or "",
        school_name=getattr(updated_record, "school_name", None) or "",
        latitude=float(getattr(updated_record, "latitude", 0.0)),
        longitude=float(getattr(updated_record, "longitude", 0.0)),
        country_iso3_code=existing.country,
        education_level=getattr(updated_record, "education_level", None),
        contact_name=getattr(updated_record, "contact_name", None),
        contact_email=getattr(updated_record, "contact_email", None),
        verification_status=verification_status,
    )

    new_file_upload = await create_school_registration_file_upload(
        db,
        uploader_id=existing.uploader_id,
        uploader_email=existing.uploader_email,
        country=existing.country,
        source="nocodb",
        giga_id_school=school_data.giga_id_school,
    )

    try:
        registration_metadata = build_registration_metadata(school_data)
        logger.info(
            f"Writing NocoDB registration CSV to ADLS for {school_data.giga_id_school}"
        )
        write_registration_csv_to_adls(
            school_data.model_dump(),
            new_file_upload,
            registration_metadata,
            mode="update",
        )
    except Exception as err:
        logger.error(
            f"Failed to write NocoDB registration file for {school_data.giga_id_school}: {err}",
            exc_info=True,
        )
        await db.execute(delete(FileUpload).where(FileUpload.id == new_file_upload.id))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write registration file to storage: {str(err)}",
        ) from err

    response_data = {
        "message": "Re-trigger initiated successfully.",
        "file_upload_id": new_file_upload.id,
        "giga_id_school": school_data.giga_id_school,
        "verification_status": school_data.verification_status,
    }
    logger.info(
        f"Re-trigger completed successfully for {school_data.giga_id_school}: {response_data}"
    )

    return response_data
