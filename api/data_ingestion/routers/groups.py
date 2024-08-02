from fastapi import APIRouter, Depends, HTTPException, Security, status
from pydantic import UUID4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.models import Role, User
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.group import (
    AddGroupMemberRequest,
    CreateGroupRequest,
    GraphGroup,
    ModifyUserAccessRequest,
    UpdateGroupRequest,
)
from data_ingestion.schemas.user import DatabaseRole, DatabaseUser, GraphUser

router = APIRouter(
    prefix="/api/groups",
    tags=["groups"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[DatabaseRole])
async def list_groups(
    db: AsyncSession = Depends(get_db),
):
    return await GroupsApi.list_groups(db)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=GraphGroup,
    dependencies=[Security(IsPrivileged())],
)
async def create_group(body: CreateGroupRequest):
    return await GroupsApi.create_group(body)


@router.get("/{id}", response_model=GraphGroup, dependencies=[Security(IsPrivileged())])
async def get_group(id: UUID4):
    return await GroupsApi.get_group(id)


@router.patch(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def edit_group(id: UUID4, body: UpdateGroupRequest):
    await GroupsApi.update_group(id, body)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def delete_group(id: UUID4):
    await GroupsApi.delete_group(id)


@router.get(
    "/{id}/users",
    response_model=list[GraphUser],
    dependencies=[Security(IsPrivileged())],
)
async def list_group_members(id: UUID4):
    return await GroupsApi.list_group_members(group_id=id)


@router.post(
    "/{id}/users",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def add_user_to_group(id: UUID4, body: AddGroupMemberRequest):
    await GroupsApi.add_group_member(group_id=id, user_id=body.user_id)


@router.delete(
    "/{id}/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def remove_user_from_group(id: UUID4, user_id: UUID4):
    await GroupsApi.remove_group_member(group_id=id, user_id=user_id)


@router.post(
    "/{user_id}",
    response_model=DatabaseUser,
    dependencies=[Security(IsPrivileged())],
)
async def modify_user_access(
    user_id: str, body: ModifyUserAccessRequest, db: AsyncSession = Depends(get_db)
):
    user = await db.scalar(
        select(User).where(User.id == user_id).options(selectinload(User.roles))
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if len(body.groups_to_add) > 0:
        requested_roles_add = await db.scalars(
            select(Role).where(Role.id.in_([str(g) for g in body.groups_to_add]))
        )
        for r in requested_roles_add:
            user.roles.add(r)

    if len(body.groups_to_remove) > 0:
        requested_roles_remove = await db.scalars(
            select(Role).where(Role.id.in_([str(g) for g in body.groups_to_remove]))
        )
        for r in requested_roles_remove:
            user.roles.discard(r)

    user.given_name = body.given_name
    user.surname = body.surname
    await db.commit()

    return user
