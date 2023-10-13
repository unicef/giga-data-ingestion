from typing import Optional

from pydantic import UUID4, BaseModel, EmailStr


class User(BaseModel):
    name: str
    email: EmailStr
    roles: list[str]


class GraphRoleAssignment(BaseModel):
    id: str
    app_role_id: str | UUID4


class GraphRole(BaseModel):
    id: UUID4
    description: str
    display_name: str
    value: str


class GraphApplication(BaseModel):
    id: UUID4
    app_id: UUID4
    app_roles: list[GraphRole]


class GraphUser(BaseModel):
    id: UUID4
    account_enabled: bool
    mail: Optional[EmailStr]
    display_name: Optional[str]
    user_principal_name: EmailStr
    app_role_assignments: list[GraphRoleAssignment]
