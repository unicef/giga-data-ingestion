import json

import requests
from data_ingestion.schemas.group import (
    AddMemberToGroupsRequest,
    CreateGroupRequest,
    GraphGroup,
    UpdateGroupRequest,
)
from data_ingestion.schemas.user import GraphUser
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from msgraph.generated.groups.groups_request_builder import (
    GroupsRequestBuilder,
)
from msgraph.generated.models.group import Group
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from msgraph.generated.models.reference_create import ReferenceCreate
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from pydantic import UUID4

from .auth import credential, graph_client


def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]  # noqa: E203


class GroupsApi:
    get_group_query_parameters = (
        GroupsRequestBuilder.GroupsRequestBuilderGetQueryParameters(
            select=["id", "description", "displayName", "mail"],
            orderby=["displayName"],
        )
    )
    group_request_config = (
        GroupsRequestBuilder.GroupsRequestBuilderGetRequestConfiguration(
            query_parameters=get_group_query_parameters,
        )
    )
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
            count=True,
        )
    )
    user_request_config = (
        UsersRequestBuilder.UsersRequestBuilderGetRequestConfiguration(
            query_parameters=get_user_query_parameters,
            headers={"ConsistencyLevel": "eventual"},
        )
    )

    @classmethod
    async def list_groups(cls) -> list[GraphGroup]:
        try:
            groups = await graph_client.groups.get(
                request_configuration=cls.group_request_config
            )
            if groups and groups.value:
                return [
                    GraphGroup(**jsonable_encoder(val)) for val in groups.value
                ]
            return []
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def list_group_members(cls, group_id: UUID4) -> list[GraphUser]:
        try:
            users = await graph_client.groups.by_group_id(
                str(group_id)
            ).members.get(request_configuration=cls.user_request_config)
            if users and users.value:
                return [
                    GraphUser(**jsonable_encoder(val)) for val in users.value
                ]
            return []
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def get_group(cls, id: UUID4) -> GraphGroup:
        try:
            return await graph_client.groups.by_group_id(str(id)).get(
                request_configuration=cls.group_request_config
            )
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def add_group_member(cls, group_id: UUID4, user_id: UUID4) -> None:
        body = ReferenceCreate(
            odata_id=(
                f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"
            )
        )
        try:
            await graph_client.groups.by_group_id(
                str(group_id)
            ).members.ref.post(body=body)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def add_group_members(
        cls, group_id: UUID4, user_ids: list[UUID4]
    ) -> None:
        try:
            body = Group(
                additional_data={
                    "members@odata.bind": [
                        f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"
                        for user_id in user_ids
                    ]
                }
            )
            await graph_client.groups.by_group_id(str(group_id)).patch(
                body=body
            )
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def remove_group_member(
        cls, group_id: UUID4, user_id: UUID4
    ) -> None:
        try:
            (
                await graph_client.groups.by_group_id(str(group_id))
                .members.by_directory_object_id(str(user_id))
                .ref.delete()
            )
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def update_group(
        cls, id: UUID4, request_body: UpdateGroupRequest
    ) -> None:
        try:
            body = Group(
                **{
                    k: v
                    for k, v in request_body.model_dump().items()
                    if v is not None
                }
            )
            await graph_client.groups.by_group_id(str(id)).patch(body=body)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def create_group(
        cls, request_body: CreateGroupRequest
    ) -> GraphGroup:
        try:
            body = Group(
                **request_body.model_dump(),
                security_enabled=True,
                mail_enabled=False,
                mail_nickname="".join(
                    request_body.display_name.lower().split(" ")
                ),
                group_types=[],
            )
            return await graph_client.groups.post(body=body)
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def delete_group(cls, id: UUID4) -> None:
        try:
            await graph_client.groups.by_group_id(str(id)).delete()
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def modify_user_access(
        cls, user_id: UUID4, body: AddMemberToGroupsRequest
    ) -> None:
        ## batch
        #  requests
        ## batch repsonses

        access_token = credential.get_token(
            "https://graph.microsoft.com/.default"
        )
        graph_api_endpoint = "https://graph.microsoft.com/v1.0"

        email = body.model_dump()["email"]
        groups_to_add = body.model_dump()["groups_to_add"]
        groups_to_remove = body.model_dump()["groups_to_remove"]

        print(email)
        print(user_id)
        print(groups_to_add[0])
        print(groups_to_remove)

        headers = {
            "Authorization": "Bearer " + access_token[0],
            "Content-Type": "application/json",
        }

        # try:
        #     add_payload = {
        #         "requests": [
        #             {
        #                 "id": str(i + 1),
        #                 "method": "POST",
        #                 "url": f"/groups/{group_id}/members/$ref",
        #                 "headers": {"Content-Type": "application/json"},
        #                 "body": {
        #                     "@odata.id": f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"
        #                 },
        #             }
        #             for i, group_id in enumerate(group_ids)
        #         ]
        #     }

        #     remove_payload = {
        #         "requests": [
        #             {
        #                 "id": str(i + 1),
        #                 "method": "DELETE",
        #                 "url": f"/groups/{group_id}/members/{user_id}/$ref",
        #             }
        #             for i, group_id in enumerate(group_ids)
        #         ]
        #     }

        #     response = requests.post(
        #         url=f"{graph_api_endpoint}/$batch",
        #         headers=headers,
        #         data=json.dumps(add_payload),
        #     )

        #     response_data = response.json()
        #     return response_data

        return "data"

        # except ODataError as err:
        #     raise HTTPException(
        #         detail=err.error.message, status_code=err.response_status_code
        #     )
