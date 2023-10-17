from pydantic import UUID4, BaseModel, EmailStr


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
