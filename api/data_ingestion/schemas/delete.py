from dataclasses import dataclass


@dataclass
class DeleteRowsRequest:
    country: str
    ids: list[str]


@dataclass
class DeleteRowsSchema:
    filename: str
