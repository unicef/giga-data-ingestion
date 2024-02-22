from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class PagedResponseSchema(BaseModel, Generic[DataT]):
    data: list[DataT]
    page_index: int
    per_page: int
    total_items: int
    total_pages: int
