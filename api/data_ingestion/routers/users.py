from fastapi import APIRouter, BackgroundTasks, Depends, Security, status
from fastapi_azure_auth.user import User as AzureUser
from pydantic import UUID4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.db.primary import get_db
from data_ingestion.internal import email
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.internal.users import UsersApi
from data_ingestion.models import User
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.group import ModifyUserAccessRequest
from data_ingestion.schemas.invitation import (
    GraphInvitation,
    GraphInvitationCreateRequest,
    InviteEmailRenderRequest,
)
from data_ingestion.schemas.user import (
    DatabaseUser,
    GraphUser,
    GraphUserCreateRequest,
    GraphUserInviteAndAddGroupsRequest,
    GraphUserUpdateRequest,
)

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get(
    "",
    response_model=list[DatabaseUser],
    dependencies=[Security(IsPrivileged())],
)
async def list_users(db: AsyncSession = Depends(get_db)):
    return await db.scalars(select(User))


@router.post("", response_model=GraphUser, dependencies=[Security(IsPrivileged())])
async def create_user(body: GraphUserCreateRequest, background_tasks: BackgroundTasks):
    user_response = await UsersApi.create_user(body)
    user = user_response.user
    await GroupsApi.modify_user_access(
        user.id,
        ModifyUserAccessRequest(
            given_name=body.given_name,
            surname=body.surname,
            groups_to_add=[g.id for g in body.groups],
            groups_to_remove=[],
        ),
    )

    background_tasks.add_task(
        email.invite_user,
        InviteEmailRenderRequest(
            displayName=user.display_name,
            email=user.mail,
            temporaryPassword=user_response.temporary_password,
            groups=[g.display_name for g in body.groups],
        ),
    )
    return user_response.user


@router.post(
    "/invite",
    status_code=status.HTTP_201_CREATED,
    response_model=GraphInvitation,
    dependencies=[Security(IsPrivileged())],
)
async def invite_user(body: GraphInvitationCreateRequest):
    return await UsersApi.send_user_invite(body)


@router.post(
    "/invite_and_add_groups",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Security(IsPrivileged())],
)
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


@router.get("/me", response_model=AzureUser)
async def get_current_user(user: AzureUser = Depends(azure_scheme)):
    return user


@router.get("/me/groups")
async def get_current_user_groups(user: AzureUser = Depends(azure_scheme)):
    groups = await UsersApi.get_group_memberships(user.sub)
    return [g.display_name for g in groups]


@router.get("/email", response_model=GraphUser)
async def get_groups_from_email(azure_user: AzureUser = Depends(azure_scheme)):
    all_users = await UsersApi.list_users()
    groups = [user for user in all_users if user.mail == azure_user.preferred_username][
        0
    ]
    return groups


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    return await UsersApi.get_user(id)


@router.get("/{id}/groups", dependencies=[Security(IsPrivileged())])
async def get_user_groups(id: UUID4):
    groups = await UsersApi.get_group_memberships(id)
    return [g.display_name for g in groups]


@router.patch(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def edit_user(id: UUID4, body: GraphUserUpdateRequest):
    await UsersApi.edit_user(id, body)
