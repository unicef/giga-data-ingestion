from fastapi import APIRouter, BackgroundTasks, Security, status

from data_ingestion.internal import email
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.email import (
    DataCheckSuccessRenderRequest,
    DqReportRenderRequest,
    EmailRenderRequest,
    MasterDataReleaseNotificationRenderRequest,
    UploadSuccessRenderRequest,
)

router = APIRouter(
    prefix="/api/email",
    tags=["email"],
    dependencies=[Security(azure_scheme), Security(IsPrivileged())],
)


@router.post(
    "/dq-report-upload-success",
    status_code=status.HTTP_204_NO_CONTENT,
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
