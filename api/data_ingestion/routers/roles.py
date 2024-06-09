from fastapi import APIRouter, Depends, Security
from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy.ext.asyncio import AsyncSession

from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.roles import get_user_roles as _get_user_roles

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
