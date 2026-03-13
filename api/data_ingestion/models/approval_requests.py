from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import UUID4
from sqlalchemy import VARCHAR, DateTime, ForeignKey, UniqueConstraint, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .file_upload import FileUpload


class ApprovalRequest(BaseModel):
    __tablename__ = "approval_requests"
    __table_args__ = (
        UniqueConstraint("country", "dataset", "upload_id", name="uq_country_dataset"),
    )
    upload_id: Mapped[str] = mapped_column(
        ForeignKey("file_uploads.id"),
        nullable=True,
        index=True,
    )
    country: Mapped[str] = mapped_column(VARCHAR(3), nullable=False)
    dataset: Mapped[str] = mapped_column(nullable=False)
    enabled: Mapped[bool] = mapped_column(default=False)
    is_merge_processing: Mapped[bool] = mapped_column(default=False)
    audit_logs: Mapped[list["ApprovalRequestAuditLog"]] = relationship(
        back_populates="approval_request"
    )
    file_upload: Mapped["FileUpload | None"] = relationship(
        "FileUpload",
        foreign_keys=[upload_id],
        back_populates="approval_requests",
    )


class ApprovalRequestAuditLog(BaseModel):
    __tablename__ = "approval_request_audit_log"

    approval_request_id: Mapped[str] = mapped_column(
        ForeignKey("approval_requests.id"), nullable=False
    )
    approval_request: Mapped["ApprovalRequest"] = relationship(
        "ApprovalRequest", back_populates="audit_logs"
    )
    approved_by_id: Mapped[UUID4] = mapped_column(VARCHAR(36), nullable=False)
    approved_by_email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    approved_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


async def fetch_approvals_by_upload_ids(
    db: AsyncSession,
    upload_ids: list[str],
) -> list[ApprovalRequest]:
    query = select(ApprovalRequest).where(ApprovalRequest.id.in_(upload_ids))

    result = await db.scalars(query)
    return result.all()
