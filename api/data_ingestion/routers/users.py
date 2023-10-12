from fastapi import APIRouter, Security
from fastapi.responses import JSONResponse
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme, graph_client
from data_ingestion.schemas.user import GraphUser

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[GraphUser])
async def list_users():
    users = await graph_client.users.get()
    if users and users.value:
        return users.value
    return []


@router.post("")
async def create_user():
    pass


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    try:
        user = await graph_client.users.by_user_id(str(id)).get()
        return user
    except ODataError as err:
        return JSONResponse(
            {"message": err.message}, status_code=err.response_status_code
        )


@router.put("/{id}")
async def edit_user():
    pass


@router.patch("/{id}")
async def partial_edit_user():
    pass


@router.delete("/{id}")
async def revoke_user_access():
    pass
