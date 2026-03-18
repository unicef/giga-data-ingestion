import base64
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


def _send_mailjet_with_attachments(
    formatted_recipients: list[dict],
    subject: str,
    html_part: str | None,
    text_part: str | None,
    from_name: str,
    attachments: list[dict],
) -> None:
    """Send via Mailjet v3.1 when attachments are present."""
    base = (settings.MAILJET_API_URL or "https://api.mailjet.com").rstrip("/")
    # Be tolerant of configs that already include a version suffix (e.g. https://api.mailjet.com/v3)
    for suffix in ("/v3.1", "/v3.0", "/v3"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
            break
    url = f"{base}/v3.1/send"
    msg: dict[str, Any] = {
        "From": {"Email": settings.SENDER_EMAIL, "Name": from_name},
        "To": formatted_recipients,
        "Subject": subject,
        "HTMLPart": html_part or "",
        "TextPart": text_part or "",
    }
    mailjet_attachments = []
    for att in attachments:
        content = att.get("Base64Content") or att.get("content")
        if content is None:
            continue
        mailjet_attachments.append(
            {
                "ContentType": att.get("ContentType")
                or att.get("Content-type")
                or "application/octet-stream",
                "Filename": att.get("Filename") or "attachment",
                "Base64Content": content
                if isinstance(content, str)
                else content.decode("ascii"),
            }
        )
    if mailjet_attachments:
        msg["Attachments"] = mailjet_attachments
    payload = {"Messages": [msg]}
    result = requests.post(
        url,
        auth=(settings.MAILJET_API_KEY, settings.CLEAN_MAILJET_SECRET),
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    try:
        logger.info(
            "Mailjet send result: status=%s body=%s",
            result.status_code,
            result.json(),
        )
        if result.status_code >= 400:
            logger.error(
                "Mailjet send failed: status=%s body=%s",
                result.status_code,
                result.text,
            )
    except JSONDecodeError:
        logger.info(
            "Mailjet send result: status=%s raw=%s",
            result.status_code,
            result.text[:500],
        )


def send_email_base(
    recipients: list[str],
    subject: str,
    html_part: str = None,
    text_part: str = None,
    attachments: list[dict] = None,
):
    """Match main: mailjet_rest Client + v3 message format. Use v3.1 only when attachments present."""
    if getattr(settings, "EMAIL_TEST_RECIPIENTS", ""):
        recipients = [
            e.strip() for e in settings.EMAIL_TEST_RECIPIENTS.split(",") if e.strip()
        ]
        logger.info("Using test recipients override: %s", recipients)
    if len(recipients) == 0:
        logger.warning("No recipients provided, skipping email send")
        return

    if html_part is None and text_part is None:
        logger.warning("No email content provided, skipping email send")
        return

    from_name = "Giga Sync"
    if settings.DEPLOY_ENV != DeploymentEnvironment.PRD:
        from_name = f"{from_name} {settings.DEPLOY_ENV.name}"

    formatted_recipients = [{"Email": r} for r in recipients]

    if attachments:
        _send_mailjet_with_attachments(
            formatted_recipients, subject, html_part, text_part, from_name, attachments
        )
        return

    # No attachments: same as main – Client + v3 format
    message = {
        "FromEmail": settings.SENDER_EMAIL,
        "FromName": from_name,
        "Subject": subject,
        "Html-part": html_part,
        "Text-part": text_part,
        "Recipients": formatted_recipients,
    }
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


def send_dq_report_email_with_pdf(body: EmailRenderRequest[DqReportRenderRequest]):
    json_dump = body.props.model_dump()
    json_dump["uploadDate"] = json_dump["uploadDate"].isoformat()
    json_dump["dataQualityCheck"]["summary"]["timestamp"] = json_dump[
        "dataQualityCheck"
    ]["summary"]["timestamp"].isoformat()

    # Generate HTML and text content
    res = requests.post(
        f"{settings.EMAIL_RENDERER_SERVICE_URL}/email/dq-report",
        headers={
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
            "Content-Type": "application/json",
        },
        json=json_dump,
    )

    if not res.ok:
        try:
            raise HTTPError(res.json())
        except JSONDecodeError:
            raise HTTPError(res.text) from None

    email_data = res.json()
    html_content = email_data.get("html")
    text_content = email_data.get("text")

    # Generate PDF (renderer returns binary to avoid large JSON truncation)
    pdf_res = requests.post(
        f"{settings.EMAIL_RENDERER_SERVICE_URL}/email/dq-report-pdf",
        headers={
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
            "Content-Type": "application/json",
        },
        json=json_dump,
    )

    if not pdf_res.ok:
        try:
            raise HTTPError(pdf_res.json())
        except JSONDecodeError:
            raise HTTPError(pdf_res.text) from None

    pdf_bytes = pdf_res.content
    pdf_base64 = base64.b64encode(pdf_bytes).decode("ascii")
    disp = pdf_res.headers.get("Content-Disposition") or ""
    pdf_filename = f"data-quality-report-{body.props.country}.pdf"
    if "filename=" in disp:
        part = disp.split("filename=", 1)[1].strip().strip('"')
        if part:
            pdf_filename = part

    # Use base64 string directly as required by Mailjet v3 send API
    attachment = {
        "Content-type": "application/pdf",
        "Filename": pdf_filename,
        "content": pdf_base64,
    }

    # Send email with PDF attachment
    send_email_base(
        recipients=[body.email],
        subject="DQ summary report with PDF attachment",
        html_part=html_content,
        text_part=text_content,
        attachments=[attachment],
    )


def _build_dq_pdf_payload(props: dict) -> dict:
    """Ensure uploadDate and dataQualityCheck.summary.timestamp are JSON-safe (ISO strings)."""
    payload = dict(props)
    upload_date = payload.get("uploadDate")
    payload["uploadDate"] = (
        upload_date.isoformat()
        if hasattr(upload_date, "isoformat")
        else str(upload_date)
    )
    dq = payload.get("dataQualityCheck") or {}
    summary = dq.get("summary") or {}
    ts = summary.get("timestamp")
    if ts is not None and hasattr(ts, "isoformat"):
        payload.setdefault("dataQualityCheck", {})["summary"] = {
            **summary,
            "timestamp": ts.isoformat(),
        }
    elif ts is not None:
        payload.setdefault("dataQualityCheck", {})["summary"] = {
            **summary,
            "timestamp": str(ts),
        }
    return payload


async def generate_dq_report_pdf(body: EmailRenderRequest[DqReportRenderRequest]):
    json_dump = _build_dq_pdf_payload(body.props.model_dump())
    base = str(settings.EMAIL_RENDERER_SERVICE_URL).rstrip("/")
    res = requests.post(
        f"{base}/email/dq-report-pdf",
        headers={
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
            "Content-Type": "application/json",
        },
        json=json_dump,
    )
    if not res.ok:
        try:
            raise HTTPError(res.json())
        except JSONDecodeError:
            raise HTTPError(res.text) from None
    logger.info(f"PDF generation response: {res.status_code}")
    pdf_bytes = res.content
    pdf_b64 = base64.b64encode(pdf_bytes).decode("ascii")
    disp = res.headers.get("Content-Disposition") or ""
    filename = f"data-quality-report-{body.props.country}-{body.props.uploadId}.pdf"
    if "filename=" in disp:
        part = disp.split("filename=", 1)[1].strip().strip('"')
        if part:
            filename = part
    return {"pdf": pdf_b64, "filename": filename}


async def generate_dq_report_pdf_from_payload(payload: dict) -> dict:
    """Generate PDF using a pre-built payload (for lenient frontend request)."""
    base = str(settings.EMAIL_RENDERER_SERVICE_URL).rstrip("/")
    res = requests.post(
        f"{base}/email/dq-report-pdf",
        headers={
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
            "Content-Type": "application/json",
        },
        json=payload,
    )
    if not res.ok:
        try:
            raise HTTPError(res.json())
        except JSONDecodeError:
            raise HTTPError(res.text) from None
    logger.info(f"PDF generation response: {res.status_code}")
    pdf_bytes = res.content
    pdf_b64 = base64.b64encode(pdf_bytes).decode("ascii")
    disp = res.headers.get("Content-Disposition") or ""
    filename = "data-quality-report.pdf"
    if "filename=" in disp:
        part = disp.split("filename=", 1)[1].strip().strip('"')
        if part:
            filename = part
    return {"pdf": pdf_b64, "filename": filename}


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
