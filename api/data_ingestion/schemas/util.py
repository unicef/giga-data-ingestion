from pydantic import BaseModel


class ResponseWithDateKeyBody(BaseModel):
    dayofyear: str


class IsValidDateTimeFormat(BaseModel):
    datetime_str: str
    format_code: str
