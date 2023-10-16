from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from msgraph.generated.models.o_data_errors.o_data_error import ODataError

from data_ingestion.internal.auth import graph_client
from data_ingestion.schemas.user import GraphApplication, GraphRole
from data_ingestion.settings import settings


class RolesApi:
    @classmethod
    async def list_roles(cls) -> list[GraphRole]:
        try:
            apps = await graph_client.applications.by_application_id(
                settings.AZURE_APPLICATION_ID
            ).get()
            apps = GraphApplication(**jsonable_encoder(apps))
            return sorted(apps.app_roles, key=lambda r: r.display_name)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )
