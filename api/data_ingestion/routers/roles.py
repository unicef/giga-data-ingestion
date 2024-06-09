from fastapi import APIRouter, Depends, Security
from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.models import Role, User

router = APIRouter(
    prefix="/api/roles",
    tags=["roles"],
    dependencies=[Security(azure_scheme)],
)


@router.get("/me")
async def get_current_user_roles(
    user: AzureUser = Depends(azure_scheme),
    db: AsyncSession = Depends(get_db),
):
    matched = await db.scalar(
        select(User)
        .where(User.sub == user.sub)
        .options(joinedload(User.roles, innerjoin=True))
    )
    emails = user.claims["emails"]
    if len(emails) == 0:
        email = ""
    else:
        email = emails[0]

    if matched is None and email:
        new_user = User(sub=user.sub, email=email)

        if any(
            [
                email.endswith("@thinkingmachin.es"),
                email.endswith("@unicef.org"),
            ]
        ):
            admin_role = await db.scalar(select(Role).where(Role.name == "Admin"))
            new_user.roles.append(admin_role)

        db.add(new_user)
        await db.commit()
        return [r.name for r in new_user.roles]

    return [r.name for r in matched.roles]
