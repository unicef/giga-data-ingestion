from typing import List

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


class AddMemberToGroupsRequest(BaseModel):
    email: str
    groups_to_add: List[UUID4]
    groups_to_remove: List[UUID4]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "group_id": [
                        "90d96fc1-445c-4092-b175-40153bae7a45",  # 1 AAD DC
                        "153aca72-f3e0-4367-b084-9f1961e9743b",  # 2 ADMIN,
                        "f86894ca-ab17-4918-8ad9-cec92a57d986",
                        "b7b07b18-80d8-42f4-8c94-b186163a13b6",
                    ]
                }
            ]
        }
    }
