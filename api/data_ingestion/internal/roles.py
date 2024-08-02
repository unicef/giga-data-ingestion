from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from data_ingestion.models import Role, User


async def get_user_roles(user: AzureUser, db: AsyncSession) -> list[str]:
    emails = user.claims.get("emails", [])
    if len(emails) == 0:
        email = ""
    else:
        email = emails[0]

    matched = await db.scalar(
        select(User)
        .where(User.email == email)
        .options(joinedload(User.roles, innerjoin=True))
    )

    is_users_empty = not await db.scalar(select(exists().where(User.id.isnot(None))))

    if matched is None and email:
        new_user = User(
            email=email,
            given_name=user.given_name,
            surname=user.family_name,
        )

        if (
            any(
                [
                    email.endswith("@thinkingmachin.es"),
                    email.endswith("@unicef.org"),
                ]
            )
            and is_users_empty
        ):
            admin_role = await db.scalar(select(Role).where(Role.name == "Admin"))
            new_user.roles.add(admin_role)
        else:
            regular_role = await db.scalar(select(Role).where(Role.name == "Regular"))
            new_user.roles.add(regular_role)

        db.add(new_user)
        await db.commit()
        return [r.name for r in new_user.roles]

    return [r.name for r in matched.roles]
