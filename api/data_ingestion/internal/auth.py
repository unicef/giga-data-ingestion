from dataclasses import dataclass, field

from fastapi.security import HTTPBearer
from fastapi_azure_auth import B2CMultiTenantAuthorizationCodeBearer
from msgraph import GraphServiceClient

from azure.identity import ClientSecretCredential
from data_ingestion.settings import settings


@dataclass
class LocalAzureUser:
    """Mock Azure user returned in local dev mode instead of a validated JWT user."""

    claims: dict = field(
        default_factory=lambda: {
            "emails": ["dev@example.com"],
            "given_name": "Local",
            "family_name": "Dev",
        }
    )
    given_name: str = "Local"
    family_name: str = "Dev"
    sub: str = "local-dev-user"
    preferred_username: str = "dev@example.com"
    access_token: str = "local-dev-token"
    is_guest: bool = False


async def local_auth_bypass() -> LocalAzureUser:
    return LocalAzureUser()


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
