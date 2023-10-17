from fastapi import APIRouter, Security, status
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.schemas.group import AddGroupMemberRequest, GraphGroup

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


@router.patch("/{id}")
async def edit_group():
    pass


@router.get("/{id}/users")
async def list_group_members(id: UUID4):
    return await GroupsApi.list_group_members(group_id=id)


@router.post("/{id}/users", status_code=status.HTTP_204_NO_CONTENT)
async def add_user_to_group(id: UUID4, body: AddGroupMemberRequest):
    await GroupsApi.add_group_member(group_id=id, user_id=body.user_id)


@router.delete("/{id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_group(id: UUID4, user_id: UUID4):
    await GroupsApi.remove_group_member(group_id=id, user_id=user_id)
