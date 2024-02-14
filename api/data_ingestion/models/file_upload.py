from pydantic import UUID4, AwareDatetime, EmailStr
from sqlalchemy import VARCHAR, Column, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class FileUpload(BaseModel):
    __tablename__ = "file_uploads"

    timestamp: Mapped[AwareDatetime] = mapped_column(
        Column(
            DateTime(timezone=True),
            server_default=func.now(),
        )
    )
    uploader_id: Mapped[UUID4] = mapped_column(VARCHAR(36), nullable=False, index=True)
    uploader_email: Mapped[EmailStr] = mapped_column(String(), nullable=False)
    upload_path: Mapped[str] = mapped_column(nullable=False)
    dq_report_path: Mapped[str] = mapped_column(nullable=True, default=None)
