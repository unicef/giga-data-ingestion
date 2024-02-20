import requests
from loguru import logger
from requests import HTTPError, JSONDecodeError

from azure.communication.email import EmailClient
from data_ingestion.schemas.invitation import InviteEmailRenderRequest
from data_ingestion.settings import settings


def invite_user(body: InviteEmailRenderRequest):
    client = EmailClient.from_connection_string(settings.AZURE_EMAIL_CONNECTION_STRING)

    res = requests.post(
        f"{settings.EMAIL_RENDERER_SERVICE_URL}email/invite-user",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
        },
        json=body.model_dump(),
    )
    if not res.ok:
        try:
            raise HTTPError(res.json())
        except JSONDecodeError:
            raise HTTPError(res.text) from None

    data = res.json()

    message = {
        "senderAddress": settings.AZURE_EMAIL_SENDER,
        "recipients": {"to": [{"address": body.email}]},
        "content": {
            "subject": "Welcome to Giga Sync",
            "html": data.get("html"),
            "plainText": data.get("text"),
        },
    }
    poller = client.begin_send(message)
    result = poller.result()
    logger.info(result)
