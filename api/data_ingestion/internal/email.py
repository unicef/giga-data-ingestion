from typing import Any

import requests
from fastapi.encoders import jsonable_encoder
from loguru import logger
from mailjet_rest import Client
from requests import HTTPError, JSONDecodeError

from data_ingestion.schemas.email import (
    DataCheckSuccessRenderRequest,
    DqReportRenderRequest,
    EmailRenderRequest,
    MasterDataReleaseNotificationRenderRequest,
    UploadSuccessRenderRequest,
)
from data_ingestion.schemas.invitation import InviteEmailRenderRequest
from data_ingestion.settings import DeploymentEnvironment, settings


def send_email_base(
    endpoint: str,
    json: dict[str, Any],
    recipient: str,
    subject: str,
):
    client = Client(
        auth=(settings.MAILJET_API_KEY, settings.MAILJET_SECRET_KEY),
        api_url=settings.MAILJET_API_URL,
    )

    res = requests.post(
        f"{settings.EMAIL_RENDERER_SERVICE_URL}{endpoint}",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
        },
        json=json,
    )
    if not res.ok:
        try:
            raise HTTPError(res.json())
        except JSONDecodeError:
            raise HTTPError(res.text) from None

    data = res.json()

    from_name = "Giga Sync"
    if settings.DEPLOY_ENV != DeploymentEnvironment.PRD:
        from_name = f"{from_name} {settings.DEPLOY_ENV.name}"

    message = {
        "FromEmail": settings.SENDER_EMAIL,
        "FromName": from_name,
        "Subject": subject,
        "Recipients": [{"Email": recipient}],
        "Html-part": data.get("html"),
        "Text-part": data.get("text"),
    }

    result = client.send.create(data=message)
    logger.info(result.json())


def invite_user(body: InviteEmailRenderRequest):
    send_email_base(
        endpoint="email/invite-user",
        json=body.model_dump(),
        recipient=body.email,
        subject="Welcome to Giga Sync",
    )


def send_upload_success_email(body: EmailRenderRequest[UploadSuccessRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()

    send_email_base(
        endpoint="email/dq-report-upload-success",
        json=json_dump,
        recipient=body.email,
        subject="Successfuly uploaded file",
    )


def send_check_success_email(body: EmailRenderRequest[DataCheckSuccessRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()
    json_dump["checkDate"] = json_dump["checkDate"].isoformat()
    send_email_base(
        endpoint="email/dq-report-check-success",
        json=json_dump,
        recipient=body.email,
        subject="Data checks successfully passed",
    )


def send_dq_report_email(body: EmailRenderRequest[DqReportRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()
    json_dump["dataQualityCheck"]["summary"]["timestamp"] = json_dump[
        "dataQualityCheck"
    ]["summary"]["timestamp"].isoformat()
    send_email_base(
        endpoint="email/dq-report",
        json=json_dump,
        recipient=body.email,
        subject="DQ summary report",
    )


def send_master_data_release_notification(
    body: EmailRenderRequest[MasterDataReleaseNotificationRenderRequest],
):
    json_dump = jsonable_encoder(body.props.model_dump())
    send_email_base(
        endpoint="email/master-data-release-notification",
        json=json_dump,
        recipient=body.email,
        subject="Master Data Update Notification",
    )
