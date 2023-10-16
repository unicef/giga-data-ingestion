from fastapi import APIRouter, Security

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.roles import RolesApi
from data_ingestion.schemas.user import GraphRole

router = APIRouter(
    prefix="/api/roles",
    tags=["roles"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphRole])
async def list_roles():
    return await RolesApi.list_roles()


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
