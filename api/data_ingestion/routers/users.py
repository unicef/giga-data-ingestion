from fastapi import APIRouter, Security, status
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.users import UsersApi
from data_ingestion.schemas.user import GraphUser

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphUser])
async def list_users():
    return await UsersApi.list_users()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user():
    pass


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    return await UsersApi.get_user(id)


@router.patch("/{id}/roles")
async def add_roles():
    pass


@router.delete("/{id}/roles", status_code=status.HTTP_204_NO_CONTENT)
async def remove_roles():
    pass
