from functools import lru_cache

from azure.storage.blob import BlobServiceClient
from data_ingestion.settings import settings


@lru_cache
def get_storage_client():
    if settings.AZURE_STORAGE_CONNECTION_STRING:
        client = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
    else:
        client = BlobServiceClient(
            f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net",
            credential=settings.AZURE_SAS_TOKEN,
        )
    return client.get_container_client(settings.AZURE_BLOB_CONTAINER_NAME)


storage_client = get_storage_client()
