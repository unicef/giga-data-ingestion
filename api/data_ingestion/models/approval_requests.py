from pydantic import UUID4
from sqlalchemy import VARCHAR, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class ApprovalRequest(BaseModel):
    __tablename__ = "approval_requests"
    __table_args__ = (
        UniqueConstraint("country", "dataset", name="uq_country_dataset"),
    )

    country: Mapped[str] = mapped_column(VARCHAR(3), nullable=False)
    dataset: Mapped[str] = mapped_column(nullable=False)
    enabled: Mapped[bool] = mapped_column(default=False)
    last_approved_by_id: Mapped[UUID4 | None] = mapped_column(
        VARCHAR(36), nullable=True
    )
    last_approved_by_email: Mapped[str | None] = mapped_column(
        VARCHAR(255), nullable=True
    )
