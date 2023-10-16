import asyncio
from typing import overload

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from msgraph.generated.models.app_role_assignment import AppRoleAssignment
from msgraph.generated.models.o_data_errors.o_data_error import ODataError
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from pydantic import UUID4

from data_ingestion.schemas.user import (
    GraphRoleAssignment,
    GraphUser,
    GraphUserWithRoles,
)

from ..settings import settings
from .auth import graph_client
from .roles import RolesApi


class UsersApi:
    get_query_parameters = UsersRequestBuilder.UsersRequestBuilderGetQueryParameters(
        select=["id", "mail", "displayName", "userPrincipalName", "accountEnabled"],
        orderby=["displayName", "mail", "userPrincipalName"],
        expand=["appRoleAssignments($select=id,appRoleId)"],
    )
    request_config = UsersRequestBuilder.UsersRequestBuilderGetRequestConfiguration(
        query_parameters=get_query_parameters
    )

    @classmethod
    async def list_users(cls) -> list[GraphUser]:
        try:
            users = await graph_client.users.get(
                request_configuration=cls.request_config
            )
            if users and users.value:
                return [GraphUser(**jsonable_encoder(val)) for val in users.value]
            return []
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @classmethod
    async def get_user(cls, id: UUID4) -> GraphUser:
        try:
            user = await graph_client.users.by_user_id(str(id)).get(
                request_configuration=cls.request_config
            )
            return user
        except ODataError as err:
            raise HTTPException(
                detail=err.error.message, status_code=err.response_status_code
            )

    @staticmethod
    @overload
    async def inject_user_roles(users: GraphUser) -> GraphUserWithRoles:
        pass

    @staticmethod
    @overload
    async def inject_user_roles(users: list[GraphUser]) -> list[GraphUserWithRoles]:
        pass

    @staticmethod
    async def inject_user_roles(
        users: GraphUser | list[GraphUser],
    ) -> GraphUserWithRoles | list[GraphUserWithRoles]:
        is_many = isinstance(users, list)
        if not is_many:
            users = [users]

        roles = await RolesApi.list_roles()
        users_with_roles: list[GraphUserWithRoles] = []
        for user in users:
            user_copy = user.model_copy()
            user_with_role = GraphUserWithRoles(
                **{**user_copy.model_dump(), "app_role_assignments": []}
            )
            for app_role in user_copy.app_role_assignments:
                role = next(
                    (r for r in roles if str(r.id) == str(app_role.app_role_id)), None
                )
                if not role:
                    continue
                user_with_role.app_role_assignments.append(role)

            users_with_roles.append(user_with_role)

        if is_many:
            return users_with_roles
        return users_with_roles[0]

    @classmethod
    async def add_role_assignments(
        cls, id: UUID4, role_ids: list[UUID4]
    ) -> list[GraphRoleAssignment]:
        bodies = [
            AppRoleAssignment(
                principal_id=id,
                resource_id=settings.AZURE_APPLICATION_ID,
                app_role_id=role_id,
            )
            for role_id in role_ids
        ]
        requests = [
            graph_client.users.by_user_id(str(id)).app_role_assignments.post(body=body)
            for body in bodies
        ]
        results: tuple[AppRoleAssignment] = await asyncio.gather(*requests)
        return [GraphRoleAssignment(**jsonable_encoder(result)) for result in results]

    @classmethod
    async def remove_role_assignments(cls, id: UUID4, role_ids: list[UUID4]) -> None:
        requests = [
            graph_client.users.by_user_id(str(id))
            .app_role_assignments.by_app_role_assignment_id(str(role_id))
            .delete()
            for role_id in role_ids
        ]
        await asyncio.gather(*requests)
