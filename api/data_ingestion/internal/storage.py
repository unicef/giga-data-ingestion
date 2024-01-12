from functools import lru_cache

from azure.storage.blob import BlobServiceClient
from data_ingestion.settings import settings


@lru_cache
def get_storage_client():
    default_credential = settings.AZURE_SAS_TOKEN
    storage_account_url = (
        f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
    )
    client = BlobServiceClient(storage_account_url, credential=default_credential)
    return client.get_container_client(settings.AZURE_BLOB_CONTAINER_NAME)


storage_client = get_storage_client()
