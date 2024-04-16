from typing import Any

import requests
from fastapi.encoders import jsonable_encoder
from loguru import logger
from requests import HTTPError, JSONDecodeError

from azure.communication.email import EmailClient
from data_ingestion.schemas.email import (
    DataCheckSuccessRenderRequest,
    DqReportRenderRequest,
    EmailRenderRequest,
    MasterDataReleaseNotificationRenderRequest,
    UploadSuccessRenderRequest,
)
from data_ingestion.schemas.invitation import InviteEmailRenderRequest
from data_ingestion.settings import settings


def send_email_base(
    endpoint: str,
    json: dict[str, Any],
    recepient: str,
    subject: str,
):
    client = EmailClient.from_connection_string(settings.AZURE_EMAIL_CONNECTION_STRING)

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

    message = {
        "senderAddress": settings.AZURE_EMAIL_SENDER,
        "recipients": {"to": [{"address": recepient}]},
        "content": {
            "subject": subject,
            "html": data.get("html"),
            "plainText": data.get("text"),
        },
    }

    poller = client.begin_send(message)
    result = poller.result()
    logger.info(result)


def invite_user(body: InviteEmailRenderRequest):
    send_email_base(
        endpoint="email/invite-user",
        json=body.model_dump(),
        recepient=body.email,
        subject="Welcome to Giga Sync",
    )


def send_upload_success_email(body: EmailRenderRequest[UploadSuccessRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()

    send_email_base(
        endpoint="email/dq-report-upload-success",
        json=json_dump,
        recepient=body.email,
        subject="Successfuly uploaded file",
    )


def send_check_success_email(body: EmailRenderRequest[DataCheckSuccessRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()
    json_dump["checkDate"] = json_dump["checkDate"].isoformat()
    send_email_base(
        endpoint="email/dq-report-check-success",
        json=json_dump,
        recepient=body.email,
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
        recepient=body.email,
        subject="DQ summary report",
    )


def send_master_data_release_notification(
    body: EmailRenderRequest[MasterDataReleaseNotificationRenderRequest],
):
    json_dump = jsonable_encoder(body.props.model_dump())
    send_email_base(
        endpoint="email/master-data-release-notification",
        json=json_dump,
        recepient=body.email,
        subject="Master Data Update Notification",
    )
