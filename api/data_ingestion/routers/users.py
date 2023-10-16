from typing import Annotated

from fastapi import APIRouter, Body, Security, status
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.users import UsersApi
from data_ingestion.schemas.user import GraphUser, GraphUserWithRoles

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphUserWithRoles])
async def list_users():
    users = await UsersApi.list_users()
    return await UsersApi.inject_user_roles(users)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user():
    pass


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    user = await UsersApi.get_user(id)
    return await UsersApi.inject_user_roles(user)


@router.patch("/{id}/roles")
async def add_roles(id: UUID4, roles: Annotated[list[UUID4], Body()]):
    return await UsersApi.add_role_assignments(id, roles)


@router.delete("/{id}/roles", status_code=status.HTTP_204_NO_CONTENT)
async def remove_roles(id: UUID4, roles: Annotated[list[UUID4], Body()]):
    await UsersApi.remove_role_assignments(id, roles)
