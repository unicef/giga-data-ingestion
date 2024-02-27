from typing import Generic, TypeVar

from pydantic import BaseModel


class B2CPolicyGroupRequest(BaseModel):
    rawGroups: list[str]


class B2CPolicyGroupResponse(BaseModel):
    value: list[str]


DataT = TypeVar("DataT")


class PagedResponseSchema(BaseModel, Generic[DataT]):
    data: list[DataT]
    page: int
    page_size: int
    total_count: int
