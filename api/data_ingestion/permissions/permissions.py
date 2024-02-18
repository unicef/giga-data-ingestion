from fastapi import Depends, HTTPException, status
from fastapi_azure_auth.user import User

from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.users import UsersApi

from .base import BasePermission


class IsAdmin(BasePermission):
    async def __call__(self, user: User = Depends(azure_scheme)):
        groups = await UsersApi.get_group_memberships(user.sub)
        is_admin = "Admin" in [g.display_name for g in groups]
        if not is_admin and self.raise_exceptions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return is_admin


class IsSuperAdmin(BasePermission):
    async def __call__(self, user: User = Depends(azure_scheme)):
        groups = await UsersApi.get_group_memberships(user.sub)
        is_super_admin = "Super" in [g.display_name for g in groups]
        if not is_super_admin and self.raise_exceptions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return is_super_admin


class IsPrivileged(BasePermission):
    def __call__(
        self,
        user: User = Depends(azure_scheme),
        is_admin: bool = Depends(IsAdmin.raises(False)),
        is_super_admin: bool = Depends(IsSuperAdmin.raises(False)),
    ):
        privileged = is_admin or is_super_admin
        if not privileged and self.raise_exceptions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return privileged
