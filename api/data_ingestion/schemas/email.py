from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class EmailRenderRequest(BaseModel, Generic[DataT]):
    email: str
    props: DataT


class UploadSuccessRenderRequest(BaseModel):
    uploadId: str
    dataset: str
    uploadDate: datetime


class DataCheckSuccessRenderRequest(BaseModel):
    uploadId: str
    dataset: str
    uploadDate: datetime
    checkDate: datetime
