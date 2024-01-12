from fastapi_azure_auth import MultiTenantAzureAuthorizationCodeBearer
from msgraph import GraphServiceClient

from azure.identity import ClientSecretCredential
from data_ingestion.settings import settings

azure_scheme = MultiTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    scopes={
        f"api://{settings.AZURE_CLIENT_ID}/user_impersonation": "Allow this application to make requests as you",
    },
    validate_iss=False,
)

credential = ClientSecretCredential(
    tenant_id=settings.AZURE_TENANT_ID,
    client_id=settings.AZURE_CLIENT_ID,
    client_secret=settings.AZURE_CLIENT_SECRET,
)

scopes = ["https://graph.microsoft.com/.default"]

graph_client = GraphServiceClient(credentials=credential, scopes=scopes)
