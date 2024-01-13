import json

import requests
from azure.identity import ClientSecretCredential
from data_ingestion.schemas.group import AddMemberToGroupsRequest
from data_ingestion.schemas.invitation import GraphInvitationCreateRequest
from data_ingestion.schemas.user import GraphUser, GraphUserUpdateRequest
from data_ingestion.settings import settings
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from msgraph.generated.models.invitation import Invitation
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from msgraph.generated.models.user import User
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from pydantic import UUID4

from .auth import credential, graph_client


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
                        u.mail = u.user_principal_name.split("#EXT")[
                            0
                        ].replace("_", "@")
                    users_out.append(u)
                return users_out

            return []
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def get_user(cls, id: UUID4) -> GraphUser:
        try:
            x = await graph_client.users.by_user_id(str(id)).get(
                request_configuration=cls.user_request_config
            )
            return x
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def edit_user(
        cls, id: UUID4, request_body: GraphUserUpdateRequest
    ) -> None:
        try:
            body = User(
                **{
                    k: v
                    for k, v in request_body.model_dump().items()
                    if v is not None
                }
            )
            await graph_client.users.by_user_id(str(id)).patch(body=body)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

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
            )

    @classmethod
    async def add_user_to_groups(
        cls, user_id: UUID4, body: AddMemberToGroupsRequest
    ) -> None:
        access_token = credential.get_token(
            "https://graph.microsoft.com/.default"
        )
        graph_api_endpoint = "https://graph.microsoft.com/v1.0"

        group_ids = body.model_dump()["group_id"]

        try:
            headers = {
                "Authorization": "Bearer " + access_token[0],
                "Content-Type": "application/json",
            }

            add_payload = {
                "requests": [
                    {
                        "id": str(i + 1),
                        "method": "POST",
                        "url": f"/groups/{group_id}/members/$ref",
                        "headers": {"Content-Type": "application/json"},
                        "body": {
                            "@odata.id": f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"
                        },
                    }
                    for i, group_id in enumerate(group_ids)
                ]
            }

            remove_payload = {
                "requests": [
                    {
                        "id": str(i + 1),
                        "method": "DELETE",
                        "url": f"/groups/{group_id}/members/{user_id}/$ref",
                    }
                    for i, group_id in enumerate(group_ids)
                ]
            }

            response = requests.post(
                url=f"{graph_api_endpoint}/$batch",
                headers=headers,
                data=json.dumps(add_payload),
            )

            response_data = response.json()
            return response_data

        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )
