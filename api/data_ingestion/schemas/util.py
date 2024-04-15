from pydantic import BaseModel


class ResponseWithDateKeyBody(BaseModel):
    dayofyear: str


class ValidDateTimeFormat(BaseModel):
    datetime_str: str
    format_code: str
