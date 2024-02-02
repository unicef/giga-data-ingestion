from data_ingestion.internal.template import env
from data_ingestion.settings import settings
from loguru import logger

from azure.communication.email import EmailClient


def main():
    client = EmailClient.from_connection_string(settings.AZURE_EMAIL_CONNECTION_STRING)

    template = env.get_template("email/data_quality/hello_world.html")

    message = {
        "senderAddress": settings.AZURE_EMAIL_SENDER,
        "recipients": {
            "to": [
                {"address": "kenneth@thinkingmachin.es"},
            ]
        },
        "content": {
            "subject": "Giga Test Email",
            "html": template.render(name="Kenneth"),
        },
    }

    poller = client.begin_send(message)
    result = poller.result()
    logger.info(result)


if __name__ == "__main__":
    main()
