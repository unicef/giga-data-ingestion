from fastapi_azure_auth import MultiTenantAzureAuthorizationCodeBearer
from msal import ConfidentialClientApplication

from data_ingestion.settings import settings

azure_scheme = MultiTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    scopes={
        f"api://{settings.AZURE_CLIENT_ID}/user_impersonation": "User impersonation",
    },
    validate_iss=False,
)

app_client = ConfidentialClientApplication(
    client_id=settings.AZURE_CLIENT_ID,
    client_credential=settings.AZURE_CLIENT_SECRET,
    authority=settings.AUTHORITY_URL,
)

app_token = app_client.acquire_token_for_client(
    scopes=["https://graph.microsoft.com/.default"]
)

graph_base_url = "https://graph.microsoft.com/v1.0"
