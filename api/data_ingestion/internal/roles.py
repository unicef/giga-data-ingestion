from uuid import uuid4

from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from data_ingestion.models import Role, User
from data_ingestion.settings import settings


async def create_user_if_not_exist_and_assign_roles(
    email: str, given_name: str, surname: str, db: AsyncSession
):
    new_user = User(
        id=str(uuid4()),
        email=email,
        given_name=given_name,
        surname=surname,
    )

    if email in settings.ADMIN_EMAIL_LIST:
        admin_role = await db.scalar(select(Role).where(Role.name == "Admin"))
        new_user.roles.add(admin_role)

    db.add(new_user)
    await db.commit()


async def get_user_roles(azure_user: AzureUser, db: AsyncSession) -> list[str]:
    emails = azure_user.claims.get("emails", [])
    if len(emails) == 0:
        email = ""
    else:
        email = emails[0]

    user = await db.scalar(
        select(User).where(User.email == email).options(joinedload(User.roles))
    )

    if user is None and email:
        await create_user_if_not_exist_and_assign_roles(
            email=email,
            given_name=azure_user.given_name,
            surname=azure_user.family_name,
            db=db,
        )

        newly_committed_user = await db.scalar(
            select(User).where(User.email == email).options(joinedload(User.roles))
        )

        return [r.name for r in newly_committed_user.roles]

    return [r.name for r in user.roles]
