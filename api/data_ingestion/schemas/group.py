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
        if not any(v is not None for v in self.model_dump().values()):
            raise ValueError("At least one field must be provided")


class CreateGroupRequest(BaseModel):
    description: str
    display_name: str


class ModifyUserAccessRequest(BaseModel):
    groups_to_add: list[UUID4]
    groups_to_remove: list[UUID4]
    given_name: str
    surname: str
