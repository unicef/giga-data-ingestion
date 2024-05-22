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
    recipients: list[str],
    subject: str,
    html_part: str,
    text_part: str = None,
):
    if len(recipients) == 0:
        logger.warning("No recipients provided, skipping email send")
        return

    client = Client(
        auth=(settings.MAILJET_API_KEY, settings.MAILJET_SECRET_KEY),
        api_url=settings.MAILJET_API_URL,
    )

    from_name = "Giga Sync"
    if settings.DEPLOY_ENV != DeploymentEnvironment.PRD:
        from_name = f"{from_name} {settings.DEPLOY_ENV.name}"

    message = {
        "FromEmail": settings.SENDER_EMAIL,
        "FromName": from_name,
        "Subject": subject,
        "Html-part": html_part,
        "Text-part": text_part,
    }

    formatted_recipients = [{"Email": r} for r in recipients]

    if len(recipients) > 1:
        message["Bcc"] = formatted_recipients
    else:
        message["Recipients"] = formatted_recipients

    result = client.send.create(data=message)
    logger.info(result.json())


def send_rendered_email(
    endpoint: str,
    json: dict[str, Any],
    recipients: list[str],
    subject: str,
):
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
    html = data.get("html")
    text = data.get("text")

    send_email_base(recipients, subject, html, text)


def invite_user(body: InviteEmailRenderRequest):
    send_rendered_email(
        endpoint="email/invite-user",
        json=body.model_dump(),
        recipients=[body.email],
        subject="Welcome to Giga Sync",
    )


def send_upload_success_email(body: EmailRenderRequest[UploadSuccessRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()

    send_rendered_email(
        endpoint="email/dq-report-upload-success",
        json=json_dump,
        recipients=[body.email],
        subject="Successfuly uploaded file",
    )


def send_check_success_email(body: EmailRenderRequest[DataCheckSuccessRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()
    json_dump["checkDate"] = json_dump["checkDate"].isoformat()
    send_rendered_email(
        endpoint="email/dq-report-check-success",
        json=json_dump,
        recipients=[body.email],
        subject="Data checks successfully passed",
    )


def send_dq_report_email(body: EmailRenderRequest[DqReportRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()
    json_dump["dataQualityCheck"]["summary"]["timestamp"] = json_dump[
        "dataQualityCheck"
    ]["summary"]["timestamp"].isoformat()
    send_rendered_email(
        endpoint="email/dq-report",
        json=json_dump,
        recipients=[body.email],
        subject="DQ summary report",
    )


def send_master_data_release_notification(
    body: EmailRenderRequest[MasterDataReleaseNotificationRenderRequest],
):
    json_dump = jsonable_encoder(body.props.model_dump())
    send_rendered_email(
        endpoint="email/master-data-release-notification",
        json=json_dump,
        recipients=[body.email],
        subject="Master Data Update Notification",
    )
