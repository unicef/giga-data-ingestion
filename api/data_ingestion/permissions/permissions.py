from fastapi import Depends, HTTPException, status
from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.internal.auth import azure_scheme

from ..db.primary import get_db
from ..internal.roles import get_user_roles
from .base import BasePermission


class IsAdmin(BasePermission):
    async def __call__(
        self,
        user: AzureUser = Depends(azure_scheme),
        db: AsyncSession = Depends(get_db),
    ):
        roles = await get_user_roles(user, db)
        is_admin = "Admin" in roles
        if not is_admin and self.raise_exceptions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return is_admin


class IsSuperAdmin(BasePermission):
    async def __call__(
        self,
        user: AzureUser = Depends(azure_scheme),
        db: AsyncSession = Depends(get_db),
    ):
        roles = await get_user_roles(user, db)
        is_super_admin = "Super" in roles
        if not is_super_admin and self.raise_exceptions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return is_super_admin


class IsPrivileged(BasePermission):
    def __call__(
        self,
        user: AzureUser = Depends(azure_scheme),
        is_admin: bool = Depends(IsAdmin.raises(False)),
        is_super_admin: bool = Depends(IsSuperAdmin.raises(False)),
    ):
        privileged = is_admin or is_super_admin
        if not privileged and self.raise_exceptions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return privileged
