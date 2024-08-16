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


@router.post("/send-email", status_code=status.HTTP_200_OK)
def send_generic_email(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(email_header)],
    body: GenericEmailRequest,
):
    if credentials.credentials != settings.EMAIL_RENDERER_BEARER_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    send_email_base(**body.model_dump())
    print("LOGGERS")
    return {
        "MAILJET_API_URL": settings.MAILJET_API_URL,
        "MAILJET_API_KEY": settings.MAILJET_API_KEY,
        "MAILJET_SECRET_KEY": settings.MAILJET_SECRET_KEY,
    }
