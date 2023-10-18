from fastapi import Depends, HTTPException, status
from fastapi_azure_auth.user import User

from data_ingestion.internal.auth import azure_scheme


async def is_super_admin(user: User = Depends(azure_scheme)):
    if "Super" not in user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)


async def is_admin(user: User = Depends(azure_scheme)):
    if "Admin" not in user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
