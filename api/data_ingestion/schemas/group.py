from pydantic import UUID4, BaseModel


class GraphGroup(BaseModel):
    id: UUID4
    description: str | None
    display_name: str


class AddGroupMemberRequest(BaseModel):
    user_id: UUID4


class AddGroupMembersRequest(BaseModel):
    user_ids: list[UUID4]
