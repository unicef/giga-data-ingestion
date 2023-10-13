from fastapi import APIRouter, Security
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from msgraph.generated.models.o_data_errors.o_data_error import ODataError

from data_ingestion.internal.auth import azure_scheme, graph_client
from data_ingestion.schemas.user import GraphApplication, GraphRole
from data_ingestion.settings import settings

router = APIRouter(
    prefix="/api/roles",
    tags=["roles"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphRole])
async def list_roles():
    try:
        apps = await graph_client.applications.by_application_id(
            settings.AZURE_APPLICATION_ID
        ).get()
        apps = GraphApplication(**jsonable_encoder(apps))
        return sorted(apps.app_roles, key=lambda r: r.display_name)
    except ODataError as err:
        return JSONResponse(
            {"message": err.error.message}, status_code=err.response_status_code
        )


@router.post("")
async def create_role():
    pass


@router.get("/{id}")
async def get_role():
    pass


@router.put("/{id}")
async def edit_role():
    pass


@router.delete("/{id}")
async def delete_role():
    pass
