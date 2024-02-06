import requests
from data_ingestion.settings import settings
from loguru import logger
from requests import HTTPError, JSONDecodeError

from azure.communication.email import EmailClient


def main():
    client = EmailClient.from_connection_string(settings.AZURE_EMAIL_CONNECTION_STRING)

    res = requests.post(
        f"{settings.EMAIL_RENDERER_SERVICE_URL}email/dq-report",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.EMAIL_RENDERER_BEARER_TOKEN}",
        },
        json={
            "name": "John Doe",
        },
    )
    if not res.ok:
        try:
            raise HTTPError(res.json())
        except JSONDecodeError:
            raise HTTPError(res.text) from None

    data = res.json()

    message = {
        "senderAddress": settings.AZURE_EMAIL_SENDER,
        "recipients": {
            "to": [
                {"address": recipient} for recipient in settings.EMAIL_TEST_RECIPIENTS
            ]
        },
        "content": {
            "subject": "Giga Test Email",
            "html": data.get("html"),
            "plainText": data.get("text"),
        },
    }
    poller = client.begin_send(message)
    result = poller.result()
    logger.info(result)


if __name__ == "__main__":
    main()
