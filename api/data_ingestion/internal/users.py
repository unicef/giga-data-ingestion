from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from msgraph.generated.models.invitation import Invitation
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from msgraph.generated.models.user import User
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from pydantic import UUID4

from data_ingestion.schemas.invitation import GraphInvitationCreateRequest
from data_ingestion.schemas.user import GraphUser, GraphUserUpdateRequest
from data_ingestion.settings import settings

from .auth import graph_client


class UsersApi:
    get_user_query_parameters = (
        UsersRequestBuilder.UsersRequestBuilderGetQueryParameters(
            select=[
                "id",
                "mail",
                "displayName",
                "userPrincipalName",
                "accountEnabled",
                "externalUserState",
            ],
            orderby=["displayName", "mail", "userPrincipalName"],
            expand=["memberOf($select=id,description,displayName)"],
        )
    )
    user_request_config = (
        UsersRequestBuilder.UsersRequestBuilderGetRequestConfiguration(
            query_parameters=get_user_query_parameters,
            headers={"ConsistencyLevel": "eventual"},
        )
    )

    @classmethod
    async def list_users(cls) -> list[GraphUser]:
        try:
            users = await graph_client.users.get(
                request_configuration=cls.user_request_config
            )
            if users and users.value:
                users_out = []
                for val in users.value:
                    u = GraphUser(**jsonable_encoder(val))
                    if not u.mail and "#EXT#" in u.user_principal_name:
                        u.mail = u.user_principal_name.split("#EXT")[0].replace(
                            "_", "@"
                        )
                    users_out.append(u)
                return users_out

            return []
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            ) from err

    @classmethod
    async def get_user(cls, id: UUID4) -> GraphUser:
        try:
            return await graph_client.users.by_user_id(str(id)).get(
                request_configuration=cls.user_request_config
            )
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            ) from err

    @classmethod
    async def edit_user(cls, id: UUID4, request_body: GraphUserUpdateRequest) -> None:
        try:
            body = User(
                **{k: v for k, v in request_body.model_dump().items() if v is not None}
            )
            await graph_client.users.by_user_id(str(id)).patch(body=body)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            ) from err

    @classmethod
    async def send_user_invite(
        cls, request_body: GraphInvitationCreateRequest
    ) -> Invitation:
        try:
            body = Invitation(
                **request_body.model_dump(),
                invite_redirect_url=settings.WEB_APP_REDIRECT_URI,
                send_invitation_message=True,
            )
            return await graph_client.invitations.post(body=body)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            ) from err
