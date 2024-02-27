from fastapi import APIRouter, BackgroundTasks, Security

from data_ingestion.internal import email
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.email import (
    DataCheckSuccessRenderRequest,
    EmailRenderRequest,
    UploadSuccessRenderRequest,
)

router = APIRouter(
    prefix="/api/email",
    tags=["email"],
    dependencies=[Security(azure_scheme)],
)


@router.post("/upload_success_email", dependencies=[Security(IsPrivileged())])
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
    return 0


@router.post("/check_success_email", dependencies=[Security(IsPrivileged())])
async def send_check_success_email(
    body: EmailRenderRequest[DataCheckSuccessRenderRequest],
    background_tasks: BackgroundTasks,
):
    props = DataCheckSuccessRenderRequest(
        uploadId=body.props.uploadId,
        dataset=body.props.dataset,
        uploadDate=body.props.uploadDate,
        checkDate=body.props.checkDate,
    )

    background_tasks.add_task(
        email.send_check_success_email,
        EmailRenderRequest[DataCheckSuccessRenderRequest](
            email=body.email,
            props=props,
        ),
    )
    return 0
