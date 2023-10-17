from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from msgraph.generated.groups.groups_request_builder import GroupsRequestBuilder
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from msgraph.generated.models.reference_create import ReferenceCreate
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from pydantic import UUID4

from data_ingestion.internal.auth import graph_client
from data_ingestion.schemas.group import GraphGroup
from data_ingestion.schemas.user import GraphUser


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
                return [GraphGroup(**jsonable_encoder(val)) for val in groups.value]
            return []
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def list_group_members(cls, group_id: UUID4) -> list[GraphUser]:
        try:
            users = await graph_client.groups.by_group_id(str(group_id)).members.get(
                request_configuration=cls.user_request_config
            )
            if users and users.value:
                return [GraphUser(**jsonable_encoder(val)) for val in users.value]
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
            odata_id=f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"
        )
        try:
            await graph_client.groups.by_group_id(str(group_id)).members.ref.post(
                body=body
            )
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def remove_group_member(cls, group_id: UUID4, user_id: UUID4) -> None:
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
