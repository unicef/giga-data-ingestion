from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.internal.users import GraphUserUpdateRequest, UsersApi
from data_ingestion.schemas.group import (
    AddGroupMemberRequest,
    CreateGroupRequest,
    GraphGroup,
    ModifyUserAccessRequest,
    UpdateGroupRequest,
)
from data_ingestion.schemas.user import GraphUser
from fastapi import APIRouter, Security, status
from pydantic import UUID4

router = APIRouter(
    prefix="/api/groups",
    tags=["groups"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphGroup])
async def list_groups():
    return await GroupsApi.list_groups()


@router.post(
    "", status_code=status.HTTP_201_CREATED, response_model=GraphGroup
)
async def create_group(body: CreateGroupRequest):
    return await GroupsApi.create_group(body)


@router.get("/{id}", response_model=GraphGroup)
async def get_group(id: UUID4):
    return await GroupsApi.get_group(id)


@router.patch("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def edit_group(id: UUID4, body: UpdateGroupRequest):
    await GroupsApi.update_group(id, body)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(id: UUID4):
    await GroupsApi.delete_group(id)


@router.get("/{id}/users", response_model=list[GraphUser])
async def list_group_members(id: UUID4):
    return await GroupsApi.list_group_members(group_id=id)


@router.post("/{id}/users", status_code=status.HTTP_204_NO_CONTENT)
async def add_user_to_group(id: UUID4, body: AddGroupMemberRequest):
    await GroupsApi.add_group_member(group_id=id, user_id=body.user_id)


@router.delete("/{id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_group(id: UUID4, user_id: UUID4):
    await GroupsApi.remove_group_member(group_id=id, user_id=user_id)


@router.post("/{user_id}", status_code=status.HTTP_200_OK)
async def modify_user_access(user_id: UUID4, body: ModifyUserAccessRequest):
    await GroupsApi.modify_user_access(user_id=user_id, body=body)

    await UsersApi.edit_user(
        user_id,
        GraphUserUpdateRequest(
            display_name=body.email,
        ),
    )
