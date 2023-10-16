from azure.identity.aio import ClientSecretCredential
from fastapi_azure_auth import B2CMultiTenantAuthorizationCodeBearer
from msgraph import GraphServiceClient

from data_ingestion.settings import settings

openid_base_url = f"https://{settings.AZURE_TENANT_NAME}.b2clogin.com/{settings.AZURE_TENANT_NAME}.onmicrosoft.com/{settings.AZURE_AUTH_POLICY_NAME}"

azure_scheme = B2CMultiTenantAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    openid_config_url=f"{openid_base_url}/v2.0/.well-known/openid-configuration",
    openapi_authorization_url=f"{openid_base_url}/oauth2/v2.0/authorize",
    openapi_token_url=f"{openid_base_url}/oauth2/v2.0/token",
    scopes={
        f"https://{settings.AZURE_TENANT_NAME}.onmicrosoft.com/{settings.AZURE_CLIENT_ID}/User.Impersonate": "Allow this application to make requests as you",
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
