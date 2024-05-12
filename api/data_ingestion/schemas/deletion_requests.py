from dataclasses import dataclass
from datetime import datetime

from pydantic import UUID4, BaseModel


@dataclass
class DeleteRowsRequest:
    country: str
    ids: list[str]


@dataclass
class DeleteRowsSchema:
    filename: str


class DeleteRows(BaseModel):
    id: str
    requested_by_id: UUID4
    requested_by_email: str
    requested_date: datetime
    country: str
