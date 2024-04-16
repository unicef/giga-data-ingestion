from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

from .data_quality_report import DataQualityCheck

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


class DqReportRenderRequest(BaseModel):
    dataset: str
    dataQualityCheck: DataQualityCheck
    uploadDate: datetime
    uploadId: str


class MasterDataReleaseNotificationRenderRequest(BaseModel):
    added: int
    country: str
    modified: int
    updateDate: datetime
    version: int
    rows: int
