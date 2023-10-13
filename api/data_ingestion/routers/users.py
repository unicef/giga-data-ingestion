from fastapi import APIRouter, Security
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from pydantic import UUID4

from data_ingestion.internal.auth import azure_scheme, graph_client
from data_ingestion.schemas.user import GraphUser

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Security(azure_scheme)],
)

get_query_parameters = UsersRequestBuilder.UsersRequestBuilderGetQueryParameters(
    select=["id", "mail", "displayName", "userPrincipalName", "accountEnabled"],
    orderby=["displayName", "mail", "userPrincipalName"],
    expand=["appRoleAssignments($select=id,appRoleId)"],
)

request_config = UsersRequestBuilder.UsersRequestBuilderGetRequestConfiguration(
    query_parameters=get_query_parameters
)


@router.get("", response_model=list[GraphUser])
async def list_users():
    try:
        users = await graph_client.users.get(request_configuration=request_config)
        if users and users.value:
            return jsonable_encoder(users.value)
        return []
    except ODataError as err:
        return JSONResponse(
            {"message": err.error.message}, status_code=err.response_status_code
        )


@router.post("")
async def create_user():
    pass


@router.get("/{id}", response_model=GraphUser)
async def get_user(id: UUID4):
    try:
        user = await graph_client.users.by_user_id(str(id)).get(
            request_configuration=request_config
        )
        return user
    except ODataError as err:
        return JSONResponse(
            {"message": err.error.message}, status_code=err.response_status_code
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
