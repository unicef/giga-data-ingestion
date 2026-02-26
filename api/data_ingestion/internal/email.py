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
    html_part: str = None,
    text_part: str = None,
    attachments: list[dict] = None,
):
    if len(recipients) == 0:
        logger.warning("No recipients provided, skipping email send")
        return

    if html_part is None and text_part is None:
        logger.warning("No email content provided, skipping email send")
        return

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
    message["Recipients"] = formatted_recipients

    # Add attachments if provided
    if attachments:
        message["Attachments"] = []
        for attachment in attachments:
            message["Attachments"].append(
                {
                    "Content-type": attachment.get(
                        "contentType", "application/octet-stream"
                    ),
                    "Filename": attachment.get("filename", "attachment"),
                    "content": attachment.get("content", ""),
                }
            )

    client = Client(
        auth=(settings.MAILJET_API_KEY, settings.CLEAN_MAILJET_SECRET),
        api_url=settings.MAILJET_API_URL,
    )
    result = client.send.create(data=message)
    try:
        logger.info(f"Send email result: {result.json()}")
    except JSONDecodeError:
        logger.info(f"Send email result: {result.text}")


def send_rendered_email(
    endpoint: str,
    json: dict[str, Any],
    recipients: list[str],
    subject: str,
    attachments: list[dict] = None,
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

    logger.info(f"Email renderer response: {res.status_code} {res.text}")

    data = res.json()
    html = data.get("html")
    text = data.get("text")
    email_attachments = data.get("attachments", [])

    # Merge any additional attachments
    if attachments:
        email_attachments.extend(attachments)

    send_email_base(recipients, subject, html, text, email_attachments)


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
