from datetime import datetime

from pydantic import UUID4
from sqlalchemy import (
    VARCHAR,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class DatasetGroup(BaseModel):
    """A user-managed grouping of datasets (e.g. "facilities"). Not seeded/fixed."""

    __tablename__ = "dataset_groups"

    key: Mapped[str] = mapped_column(VARCHAR(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)

    datasets: Mapped[list["SchemaDataset"]] = relationship(back_populates="group")


class SchemaDataset(BaseModel):
    """Registry pointer into a Delta `schemas.<key>` table — not a copy of its columns."""

    __tablename__ = "schema_datasets"

    key: Mapped[str] = mapped_column(VARCHAR(100), unique=True, nullable=False)
    group_id: Mapped[str | None] = mapped_column(
        ForeignKey("dataset_groups.id", ondelete="SET NULL"), nullable=True
    )
    group: Mapped["DatasetGroup | None"] = relationship(back_populates="datasets")

    proposals: Mapped[list["SchemaProposal"]] = relationship(back_populates="dataset")


class SchemaDatasetLink(BaseModel):
    __tablename__ = "schema_dataset_links"
    __table_args__ = (
        UniqueConstraint(
            "dataset_id", "linked_dataset_id", name="uq_dataset_linked_dataset"
        ),
    )

    dataset_id: Mapped[str] = mapped_column(
        ForeignKey("schema_datasets.id", ondelete="CASCADE"), nullable=False
    )
    linked_dataset_id: Mapped[str] = mapped_column(
        ForeignKey("schema_datasets.id", ondelete="CASCADE"), nullable=False
    )


class SchemaProposal(BaseModel):
    __tablename__ = "schema_proposals"

    dataset_id: Mapped[str] = mapped_column(
        ForeignKey("schema_datasets.id"), nullable=False
    )
    dataset: Mapped["SchemaDataset"] = relationship(back_populates="proposals")
    column_name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    proposal_type: Mapped[str] = mapped_column(VARCHAR(20), nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(20), nullable=False, default="pending")
    before_state: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    proposed_by_id: Mapped[UUID4] = mapped_column(VARCHAR(36), nullable=False)
    proposed_by_email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    delta_version: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    apply_error: Mapped[str | None] = mapped_column(Text(), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    audit_logs: Mapped[list["SchemaProposalAuditLog"]] = relationship(
        back_populates="proposal"
    )


class SchemaProposalAuditLog(BaseModel):
    __tablename__ = "schema_proposal_audit_log"

    proposal_id: Mapped[str] = mapped_column(
        ForeignKey("schema_proposals.id", ondelete="CASCADE"), nullable=False
    )
    proposal: Mapped["SchemaProposal"] = relationship(back_populates="audit_logs")
    action: Mapped[str] = mapped_column(VARCHAR(20), nullable=False)
    actor_id: Mapped[UUID4] = mapped_column(VARCHAR(36), nullable=False)
    actor_email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
