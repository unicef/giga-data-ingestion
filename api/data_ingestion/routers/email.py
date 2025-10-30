from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials

from data_ingestion.internal import email
from data_ingestion.internal.auth import email_header
from data_ingestion.internal.email import send_email_base
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.email import (
    DataCheckSuccessRenderRequest,
    DqReportRenderRequest,
    EmailRenderRequest,
    GenericEmailRequest,
    MasterDataReleaseNotificationRenderRequest,
    UploadSuccessRenderRequest,
)
from data_ingestion.settings import settings

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
    dependencies=[Security(IsPrivileged())],
)
async def generate_dq_report_pdf(
    body: EmailRenderRequest[DqReportRenderRequest],
):
    props = DqReportRenderRequest(**body.model_dump()["props"])

    # Generate PDF using the email service
    pdf_data = await email.generate_dq_report_pdf(
        EmailRenderRequest[DqReportRenderRequest](
            email=body.email,
            props=props,
        )
    )

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
