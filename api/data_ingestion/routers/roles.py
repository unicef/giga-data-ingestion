from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, Security, status
from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy import delete, exc, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.roles import get_user_roles as _get_user_roles
from data_ingestion.models import Role, UserRoleAssociation
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.user import DatabaseRole, DatabaseRoleWithMembers

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
    return await _get_user_roles(user, db)


@router.get("", response_model=list[DatabaseRole])
async def list_roles(db: AsyncSession = Depends(get_db)):
    return await db.scalars(select(Role).order_by(Role.name))


@router.get("/{id}/members", response_model=list[DatabaseRoleWithMembers])
async def get_role_members(id: str, db: AsyncSession = Depends(get_db)):
    return await db.scalars(
        select(Role).where(Role.id == id).options(selectinload(Role.users))
    )


@router.post(
    "/{id}/assign",
)
async def assign_roles(
    response: Response,
    id: str,
    target_roles: list[str],
    is_admin: Annotated[dict, Depends(IsPrivileged())],
    db: AsyncSession = Depends(get_db),
):
    try:
        get_user_roles_stmt = select(UserRoleAssociation).where(
            UserRoleAssociation.user_id == id
        )
        user_roles_association = await db.scalars(get_user_roles_stmt)

        user_roles = [role.role_id for role in user_roles_association]

        roles_to_add = [role for role in target_roles if role not in user_roles]
        roles_to_delete = [role for role in user_roles if role not in target_roles]

        for role in roles_to_add:
            await db.execute(
                insert(UserRoleAssociation).values(
                    user_id=id,
                    role_id=role,
                )
            )

        for role in roles_to_delete:
            await db.execute(
                delete(UserRoleAssociation).where(
                    UserRoleAssociation.user_id == id,
                    UserRoleAssociation.role_id == role,
                )
            )

        await db.commit()
        response.status_code = status.HTTP_204_NO_CONTENT
    except exc.SQLAlchemyError as err:
        await db.rollback()
        raise HTTPException(
            detail=err._message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) from err
