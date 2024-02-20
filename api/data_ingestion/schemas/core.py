from pydantic import BaseModel


class B2CPolicyGroupRequest(BaseModel):
    rawGroups: list[str]


class B2CPolicyGroupResponse(BaseModel):
    value: list[str]
