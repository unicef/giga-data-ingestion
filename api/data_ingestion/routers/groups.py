from fastapi import APIRouter, Security, status
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.schemas.user import GraphGroup

router = APIRouter(
    prefix="/api/groups",
    tags=["groups"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphGroup])
async def list_groups():
    return await GroupsApi.list_groups()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_group():
    pass


@router.get("/{id}")
async def get_group(id: UUID4):
    return await GroupsApi.get_group(id)


@router.put("/{id}")
async def edit_group():
    pass


@router.get("/{id}/users")
async def list_group_members(id: UUID4):
    return await GroupsApi.list_group_members(id)
