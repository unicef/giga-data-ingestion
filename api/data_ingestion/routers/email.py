import json
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.db.primary import get_db
from data_ingestion.internal import email
from data_ingestion.internal.auth import azure_scheme, email_header
from data_ingestion.internal.data_quality_checks import get_data_quality_summary
from data_ingestion.internal.email import send_email_base
from data_ingestion.internal.storage import storage_client
from data_ingestion.models import FileUpload
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.email import (
    DataCheckSuccessRenderRequest,
    DqReportPdfRequest,
    DqReportRenderRequest,
    EmailRenderRequest,
    GenericEmailRequest,
    MasterDataReleaseNotificationRenderRequest,
    UploadSuccessRenderRequest,
)
from data_ingestion.settings import settings


def _entity_for_dataset(dataset: str) -> dict[str, str]:
    """Map dataset name to entity labels used in the PDF template."""
    if dataset in {"health", "health-master"}:
        return {
            "plural": "Health Centers",
            "lowerPlural": "health centers",
            "lowerSingular": "health center",
        }
    return {
        "plural": "Schools",
        "lowerPlural": "schools",
        "lowerSingular": "school",
    }


def _load_upload_metadata(metadata_json_path: str) -> dict | None:
    try:
        blob = storage_client.get_blob_client(metadata_json_path)
        if not blob.exists():
            return None
        raw = blob.download_blob().readall()
        upload_meta = json.loads(raw)
        if isinstance(upload_meta, dict):
            return {str(k): v for k, v in upload_meta.items()}
    except Exception:
        return None
    return None


def _load_value_maps(dq_report_path: str) -> dict | None:
    try:
        dq_summary = get_data_quality_summary(dq_report_path)
        value_maps = dq_summary.get("valueMaps")
        if isinstance(value_maps, dict):
            return value_maps
    except Exception:
        return None
    return None


def _enrich_pdf_payload_from_file_upload(
    payload: dict,
    file_upload: FileUpload,
) -> None:
    if not payload.get("uploadedFileName") and file_upload.original_filename:
        payload["uploadedFileName"] = file_upload.original_filename
    if not payload.get("uploadMetadata") and file_upload.metadata_json_path:
        upload_meta = _load_upload_metadata(file_upload.metadata_json_path)
        if upload_meta is not None:
            payload["uploadMetadata"] = upload_meta
    if not payload.get("valueMaps") and file_upload.dq_report_path:
        value_maps = _load_value_maps(file_upload.dq_report_path)
        if value_maps is not None:
            payload["valueMaps"] = value_maps


router = APIRouter(
    prefix="/api/email",
    tags=["email"],
)


@router.post(
    "/dq-report-upload-success",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def send_upload_success_email(
    body: EmailRenderRequest[UploadSuccessRenderRequest],
    background_tasks: BackgroundTasks,
):
    props = UploadSuccessRenderRequest(
        uploadId=body.props.uploadId,
        dataset=body.props.dataset,
        uploadDate=body.props.uploadDate,
    )
    background_tasks.add_task(
        email.send_upload_success_email,
        EmailRenderRequest[UploadSuccessRenderRequest](
            email=body.email,
            props=props,
        ),
    )


@router.post(
    "/dq-report-check-success",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def send_check_success_email(
    body: EmailRenderRequest[DataCheckSuccessRenderRequest],
    background_tasks: BackgroundTasks,
):
    props = DataCheckSuccessRenderRequest(**body.model_dump()["props"])

    background_tasks.add_task(
        email.send_check_success_email,
        EmailRenderRequest[DataCheckSuccessRenderRequest](
            email=body.email,
            props=props,
        ),
    )


@router.post(
    "/dq-report",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def send_dq_report_email(
    body: EmailRenderRequest[DqReportRenderRequest],
    background_tasks: BackgroundTasks,
):
    props = DqReportRenderRequest(**body.model_dump()["props"])

    background_tasks.add_task(
        email.send_dq_report_email,
        EmailRenderRequest[DqReportRenderRequest](
            email=body.email,
            props=props,
        ),
    )


@router.post(
    "/dq-report-pdf",
    status_code=status.HTTP_200_OK,
    dependencies=[Security(azure_scheme)],
)
async def generate_dq_report_pdf(
    body: EmailRenderRequest[DqReportPdfRequest],
    db: AsyncSession = Depends(get_db),
):
    # Lenient schema accepts same shape as get_data_quality_check (e.g. timestamp as string)
    payload = body.props.to_renderer_payload()

    # Enrich payload from file_uploads: filename, upload metadata, value maps.
    file_upload = await db.scalar(
        select(FileUpload).where(FileUpload.id == body.props.uploadId)
    )
    if file_upload is not None:
        _enrich_pdf_payload_from_file_upload(payload, file_upload)

    if not payload.get("entity"):
        payload["entity"] = _entity_for_dataset(body.props.dataset)

    pdf_data = await email.generate_dq_report_pdf_from_payload(payload)
    return pdf_data


@router.post(
    "/dq-report-with-pdf",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def send_dq_report_email_with_pdf(
    body: EmailRenderRequest[DqReportRenderRequest],
    background_tasks: BackgroundTasks,
):
    props = DqReportRenderRequest(**body.model_dump()["props"])

    background_tasks.add_task(
        email.send_dq_report_email_with_pdf,
        EmailRenderRequest[DqReportRenderRequest](
            email=body.email,
            props=props,
        ),
    )


@router.get(
    "/dq-report-pdf-from-adls/{dataset}/{country_code}/{upload_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Security(azure_scheme)],
)
async def download_dq_report_pdf_from_adls(
    dataset: str,
    country_code: str,
    upload_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream the DQ report PDF stored in ADLS by Dagster.
    The stored PDF shares the filename stem and location of the upload's
    completed DQ artefacts.
    """
    file_upload = await db.scalar(select(FileUpload).where(FileUpload.id == upload_id))
    if file_upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File Upload ID does not exist",
        )

    if file_upload.dq_full_path:
        dq_path = Path(file_upload.dq_full_path)
        filename = f"{dq_path.stem}.pdf"
        stored_dataset = dq_path.parts[1]
        stored_country_code = dq_path.parts[3]
    else:
        filename = f"{upload_id}.pdf"
        stored_dataset = (
            dataset if dataset.startswith("school-") else f"school-{dataset}"
        )
        stored_country_code = country_code

    path = (
        f"data-quality-results/{stored_dataset}/dq-report/"
        f"{stored_country_code}/{filename}"
    )

    blob = storage_client.get_blob_client(path)
    if not blob.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DQ report PDF not found at path: {path}",
        )

    stream = blob.download_blob()
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/pdf",
    }
    return StreamingResponse(
        stream.chunks(),
        media_type="application/pdf",
        headers=headers,
    )


@router.post(
    "/master-data-release-notification",
    dependencies=[Security(IsPrivileged())],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def send_master_data_release_notification(
    body: EmailRenderRequest[MasterDataReleaseNotificationRenderRequest],
    background_tasks: BackgroundTasks,
):
    props = MasterDataReleaseNotificationRenderRequest(**body.model_dump()["props"])
    background_tasks.add_task(
        email.send_master_data_release_notification,
        EmailRenderRequest[MasterDataReleaseNotificationRenderRequest](
            email=body.email,
            props=props,
        ),
    )


@router.post("/send-email", status_code=status.HTTP_204_NO_CONTENT)
def send_generic_email(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(email_header)],
    body: GenericEmailRequest,
):
    if credentials.credentials != settings.EMAIL_RENDERER_BEARER_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    # Ensure attachments are base64-encoded strings as required by Mailjet v3 send API
    email_data = body.model_dump()
    if email_data.get("attachments"):
        import base64

        normalized_attachments = []
        for attachment in email_data["attachments"]:
            normalized = attachment.copy()
            content = normalized.get("content")
            # If content is bytes, encode to base64 string
            if isinstance(content, bytes | bytearray):
                normalized["content"] = base64.b64encode(content).decode("ascii")
            # If content is a data URL (e.g., data:application/pdf;base64,XXX), strip the prefix
            elif isinstance(content, str) and content.startswith("data:"):
                try:
                    normalized["content"] = content.split(",", 1)[1]
                except Exception:
                    pass
            # Otherwise assume it's already base64 string; leave as is
            normalized_attachments.append(normalized)
        email_data["attachments"] = normalized_attachments

    send_email_base(**email_data)
