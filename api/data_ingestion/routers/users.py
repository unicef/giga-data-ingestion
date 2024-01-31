from fastapi import APIRouter, Depends, Security, status
from fastapi_azure_auth.user import User
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.internal.users import UsersApi
from data_ingestion.schemas.group import ModifyUserAccessRequest
from data_ingestion.schemas.invitation import (
    GraphInvitation,
    GraphInvitationCreateRequest,
)
from data_ingestion.schemas.user import (
    GraphUser,
    GraphUserInviteAndAddGroupsRequest,
    GraphUserUpdateRequest,
)

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphUser])
async def list_users():
    return await UsersApi.list_users()


@router.post(
    "/invite",
    status_code=status.HTTP_201_CREATED,
    response_model=GraphInvitation,
)
async def invite_user(body: GraphInvitationCreateRequest):
    return await UsersApi.send_user_invite(body)


@router.post("/invite_and_add_groups", status_code=status.HTTP_201_CREATED)
async def invite_user_and_add_groups(body: GraphUserInviteAndAddGroupsRequest):
    groups_to_add = body.groups_to_add
    invited_user_display_name = body.invited_user_display_name
    invited_user_email_address = body.invited_user_email_address

    send_user_invite_body = GraphInvitationCreateRequest(
        invited_user_display_name=invited_user_display_name,
        invited_user_email_address=invited_user_email_address,
    )

    modify_user_access_body = ModifyUserAccessRequest(
        email=invited_user_email_address,
        groups_to_add=groups_to_add,
        groups_to_remove=[],
    )

    edit_user_body = GraphUserUpdateRequest(
        given_name=body.invited_user_given_name, surname=body.invited_user_surname
    )

    result = await UsersApi.send_user_invite(send_user_invite_body)
    await GroupsApi.modify_user_access(result.invited_user.id, modify_user_access_body)
    await UsersApi.edit_user(result.invited_user.id, edit_user_body)


@router.get("/me", response_model=User)
async def get_current_user(user: User = Depends(azure_scheme)):
    return user


@router.get("/email", response_model=GraphUser)
async def get_groups_from_email(azure_user: User = Depends(azure_scheme)):
    all_users = await UsersApi.list_users()
    groups = [user for user in all_users if user.mail == azure_user.preferred_username][
        0
    ]
    return groups


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    return await UsersApi.get_user(id)


@router.patch("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def edit_user(id: UUID4, body: GraphUserUpdateRequest):
    await UsersApi.edit_user(id, body)
