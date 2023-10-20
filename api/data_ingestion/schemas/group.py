from pydantic import UUID4, BaseModel, model_validator


class GraphGroup(BaseModel):
    id: UUID4
    description: str | None
    display_name: str


class AddGroupMemberRequest(BaseModel):
    user_id: UUID4


class AddGroupMembersRequest(BaseModel):
    user_ids: list[UUID4]


class UpdateGroupRequest(BaseModel):
    description: str | None = None
    display_name: str | None = None

    @model_validator(mode="after")
    def provide_at_least_one_field(self):
        if not any(map(lambda v: v is not None, self.model_dump().values())):
            raise ValueError("At least one field must be provided")


class CreateGroupRequest(BaseModel):
    description: str
    display_name: str
