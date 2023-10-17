from fastapi import APIRouter, Security, status
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.users import UsersApi
from data_ingestion.schemas.invitation import (
    GraphInvitation,
    GraphInvitationCreateRequest,
)
from data_ingestion.schemas.user import GraphUser, GraphUserUpdate

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphUser])
async def list_users():
    return await UsersApi.list_users()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GraphInvitation)
async def invite_user(body: GraphInvitationCreateRequest):
    return await UsersApi.send_user_invite(body)


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    return await UsersApi.get_user(id)


@router.patch("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def edit_user(id: UUID4, body: GraphUserUpdate):
    await UsersApi.edit_user(id, body)


@router.post("/{id}/groups")
async def add_user_to_group():
    pass


@router.delete("/{id}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_group():
    pass
