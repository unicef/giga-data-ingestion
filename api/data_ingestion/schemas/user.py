from typing import Literal

from pydantic import UUID4, BaseModel, EmailStr, model_validator

from .group import GraphGroup


class User(BaseModel):
    name: str
    email: EmailStr
    roles: list[str]


class GraphUser(BaseModel):
    id: UUID4
    account_enabled: bool | None
    given_name: str | None
    surname: str | None
    mail: EmailStr | None
    display_name: str | None
    user_principal_name: EmailStr
    external_user_state: Literal["Accepted", "PendingAcceptance"] | None
    member_of: list[GraphGroup] | None
    other_mails: list[EmailStr] | None


class GraphUserUpdateRequest(BaseModel):
    account_enabled: bool | None = None
    display_name: str | None = None
    given_name: str | None = None
    surname: str | None = None

    @model_validator(mode="after")
    def provide_at_least_one_field(self):
        if not any(v is not None for v in self.model_dump().values()):
            raise ValueError("At least one field must be provided")
        return self


class GraphUserCreateRequest(BaseModel):
    given_name: str
    surname: str
    email: EmailStr
    groups: list[GraphGroup]


class GraphUserCreateResponse(BaseModel):
    user: GraphUser
    temporary_password: str


class GraphUserInviteAndAddGroupsRequest(BaseModel):
    groups_to_add: list[UUID4]
    invited_user_display_name: str | None = None
    invited_user_email_address: EmailStr
    invited_user_given_name: str | None = None
    invited_user_surname: str | None = None
