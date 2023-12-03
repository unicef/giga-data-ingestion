from authlib.integrations.starlette_client import OAuth
from azure.identity import ClientSecretCredential
from fastapi.security import OpenIdConnect
from fastapi_azure_auth import MultiTenantAzureAuthorizationCodeBearer
from msgraph import GraphServiceClient

from data_ingestion.settings import settings

oauth_scheme = OAuth()
oauth_scheme.register(
    name="data_ingestion", server_metadata_url=settings.ZITADEL_AUTHORITY
)

oidc_scheme = OpenIdConnect(
    openIdConnectUrl=f"{settings.ZITADEL_AUTHORITY}/.well-known/openid-configuration",
    scheme_name="OIDC",
)

azure_scheme = MultiTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    scopes={
        f"api://{settings.AZURE_CLIENT_ID}/user_impersonation": (
            "Allow this application to make requests as you"
        ),
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
