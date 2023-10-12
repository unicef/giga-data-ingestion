from typing import Optional

from pydantic import UUID4, BaseModel, EmailStr


class User(BaseModel):
    name: str
    email: EmailStr
    roles: list[str]


class GraphUser(BaseModel):
    id: UUID4
    mail: Optional[EmailStr]
    display_name: Optional[str]
    given_name: Optional[str]
    surname: Optional[str]
    user_principal_name: EmailStr
