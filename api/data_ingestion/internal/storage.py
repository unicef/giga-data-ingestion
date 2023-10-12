from functools import lru_cache

from azure.storage.blob import BlobServiceClient

from data_ingestion.settings import settings


@lru_cache
def get_storage_client():
    if settings.PYTHON_ENV == "development":
        default_credential = {
            "account_key": settings.AZURITE_ACCOUNT_KEY,
            "account_name": settings.AZURITE_ACCOUNT_NAME,
        }
        storage_account_url = f"http://azurite:10000/{settings.AZURITE_ACCOUNT_NAME}"
    else:
        default_credential = settings.STORAGE_ACCOUNT_KEY
        storage_account_url = (
            f"https://{settings.STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
        )

    client = BlobServiceClient(storage_account_url, credential=default_credential)
    return client.get_container_client(settings.STORAGE_CONTAINER_NAME)


storage_client = get_storage_client()
