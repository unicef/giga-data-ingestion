from fastapi_azure_auth import MultiTenantAzureAuthorizationCodeBearer

from data_ingestion.settings import settings

azure_scheme = MultiTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    scopes={
        f"api://{settings.AZURE_CLIENT_ID}/user_impersonation": "User impersonation",
    },
    validate_iss=False,
)
