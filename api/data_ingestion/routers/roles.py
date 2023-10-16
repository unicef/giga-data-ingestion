from fastapi import APIRouter, Security, status

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


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_role():
    pass


@router.get("/{id}")
async def get_role():
    pass


@router.put("/{id}")
async def edit_role():
    pass
