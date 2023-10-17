from pydantic import UUID4, BaseModel, EmailStr


class GraphGroup(BaseModel):
    id: UUID4
    description: str | None
    display_name: str
    mail: EmailStr | None


class AddGroupMemberRequest(BaseModel):
    user_id: UUID4
