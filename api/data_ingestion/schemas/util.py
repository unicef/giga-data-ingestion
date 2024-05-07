from pydantic import BaseModel


class ResponseWithDateKeyBody(BaseModel):
    dayofyear: str


class ValidDateTimeFormat(BaseModel):
    datetime_str: str
    format_code: str


class ForwardRequestBody(BaseModel):
    auth: dict[str, str] | None
    data: dict[str, str] | None
    headers: dict[str, str] | None
    method: str
    params: dict[str, str | int] | None
    url: str
