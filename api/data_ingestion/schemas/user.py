from pydantic import UUID4, BaseModel, EmailStr, model_validator

from .group import GraphGroup


class User(BaseModel):
    name: str
    email: EmailStr
    roles: list[str]


class GraphUser(BaseModel):
    id: UUID4
    account_enabled: bool
    mail: EmailStr | None
    display_name: str | None
    user_principal_name: EmailStr
    member_of: list[GraphGroup]


class GraphUserUpdate(BaseModel):
    account_enabled: bool | None = None
    display_name: str | None = None

    @model_validator(mode="after")
    def provide_at_least_one_field(self):
        if not any(map(lambda v: v is not None, self.model_dump().values())):
            raise ValueError("At least one field must be provided")
