from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security, status
from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from data_ingestion.db.primary import get_db
from data_ingestion.internal import email
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.groups import GroupsApi
from data_ingestion.internal.users import UsersApi
from data_ingestion.models import Role, User
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.group import ModifyUserAccessRequest
from data_ingestion.schemas.invitation import (
    GraphInvitation,
    GraphInvitationCreateRequest,
    InviteEmailRenderRequest,
)
from data_ingestion.schemas.user import (
    DatabaseUser,
    DatabaseUserCreateRequest,
    DatabaseUserWithRoles,
    GraphUser,
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
    response_model=list[DatabaseUserWithRoles],
    dependencies=[Security(IsPrivileged())],
)
async def list_users(db: AsyncSession = Depends(get_db)):
    return await db.scalars(
        select(User)
        .order_by(User.given_name, User.surname, User.email)
        .options(selectinload(User.roles))
    )


@router.post("", response_model=DatabaseUser, dependencies=[Security(IsPrivileged())])
async def create_user(
    body: DatabaseUserCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    existing_user = await db.scalar(select(User).where(User.email == body.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
        )

    user = User(
        id=str(uuid4()),
        given_name=body.given_name,
        surname=body.surname,
        email=body.email,
    )
    roles = await db.scalars(
        select(Role).where(Role.name.in_([r.name for r in body.roles]))
    )
    roles = set(roles)
    user.roles = roles
    db.add(user)
    await db.commit()

    background_tasks.add_task(
        email.invite_user,
        InviteEmailRenderRequest(
            displayName=f"{user.given_name} {user.surname}",
            email=user.email,
            groups=[r.name for r in roles],
        ),
    )
    return user


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


@router.get("/me", response_model=DatabaseUser)
async def get_current_user(
    azure_user: AzureUser = Depends(azure_scheme), db: AsyncSession = Depends(get_db)
):
    emails = azure_user.claims.get("emails", [])
    if len(emails) == 0:
        email = ""
    else:
        email = emails[0]

    return await db.scalar(select(User).where(User.email == email))


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


@router.get("/{id}", response_model=DatabaseUserWithRoles)
async def get_user(id: str, db: AsyncSession = Depends(get_db)):
    return await db.scalar(
        select(User).where(User.id == id).options(selectinload(User.roles))
    )


@router.get("/{id}/groups", dependencies=[Security(IsPrivileged())])
async def get_user_groups(id: str):
    groups = await UsersApi.get_group_memberships(id)
    return [g.display_name for g in groups]


@router.patch(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def edit_user(
    id: str, body: GraphUserUpdateRequest, db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(User)
        .where(User.id == id)
        .values({k: v for k, v in body.model_dump().items() if v is not None})
    )
    await db.commit()


@router.delete(
    "/{email}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def delete_user(
    email: str, body: GraphUserUpdateRequest, db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(User).where(User.email == email))
    await db.commit()
