from fastapi import APIRouter, Security

from data_ingestion.internal.auth import azure_scheme

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get("")
async def list_users():
    pass


@router.post("")
async def create_user():
    pass


@router.get("/{id}")
async def get_user():
    pass


@router.put("/{id}")
async def edit_user():
    pass


@router.patch("/{id}")
async def partial_edit_user():
    pass


@router.delete("/{id}")
async def revoke_user_access():
    pass
