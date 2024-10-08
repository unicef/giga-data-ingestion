from fastapi.security import HTTPBearer
from fastapi_azure_auth import B2CMultiTenantAuthorizationCodeBearer
from msgraph import GraphServiceClient

from azure.identity import ClientSecretCredential
from data_ingestion.settings import settings

azure_scheme = B2CMultiTenantAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    openid_config_url=settings.OPENID_CONFIG_URL,
    openapi_authorization_url=settings.OPENAPI_AUTHORIZATION_URL,
    openapi_token_url=settings.OPENAPI_TOKEN_URL,
    scopes={
        "openid": "openid",
        "profile": "profile",
        "offline_access": "offline_access",
    },
    validate_iss=False,
    leeway=60,
)

graph_credentials = ClientSecretCredential(
    tenant_id=settings.AZURE_TENANT_ID,
    client_id=settings.AZURE_CLIENT_ID,
    client_secret=settings.AZURE_CLIENT_SECRET,
)

graph_scopes = ["https://graph.microsoft.com/.default"]

graph_client = GraphServiceClient(credentials=graph_credentials, scopes=graph_scopes)

email_header = HTTPBearer(scheme_name="bearer")
