from fastapi import APIRouter, Security
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


@router.post("")
async def create_user():
    pass


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    user = await UsersApi.get_user(id)
    return await UsersApi.inject_user_roles(user)


@router.put("/{id}")
async def edit_user():
    pass


@router.patch("/{id}")
async def partial_edit_user():
    pass


@router.delete("/{id}")
async def revoke_user_access():
    pass
