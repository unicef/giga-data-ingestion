from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field, field_validator

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
    country: str


class DqReportPdfRequest(BaseModel):
    """Lenient schema for PDF download: accepts the same shape as get_data_quality_check returns."""

    dataset: str
    dataQualityCheck: dict[str, Any]
    uploadDate: str | datetime
    uploadId: str
    country: str

    @field_validator("uploadDate", mode="before")
    @classmethod
    def normalize_upload_date(cls, v: Any) -> str:
        if hasattr(v, "isoformat"):
            return v.isoformat()
        return str(v)

    def to_renderer_payload(self) -> dict[str, Any]:
        """Build JSON payload for the email renderer (ISO strings for dates)."""
        payload = self.model_dump()
        payload["uploadDate"] = (
            self.uploadDate.isoformat()
            if hasattr(self.uploadDate, "isoformat")
            else str(self.uploadDate)
        )
        dq = payload.get("dataQualityCheck") or {}
        summary = dq.get("summary") or {}
        ts = summary.get("timestamp")
        if ts is not None and hasattr(ts, "isoformat"):
            payload.setdefault("dataQualityCheck", {})["summary"] = {
                **summary,
                "timestamp": ts.isoformat(),
            }
        elif ts is not None:
            payload.setdefault("dataQualityCheck", {})["summary"] = {
                **summary,
                "timestamp": str(ts),
            }
        return payload


class MasterDataReleaseNotificationRenderRequest(BaseModel):
    added: int
    country: str
    modified: int
    updateDate: datetime
    version: int
    rows: int


class GenericEmailRequest(BaseModel):
    recipients: list[str]
    subject: str
    html_part: str | None = Field(None)
    text_part: str | None = Field(None)
    attachments: list[dict] | None = Field(None)
