from datetime import datetime

from sqlalchemy import (
    VARCHAR,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
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
    """A governed schema whose immutable versions are stored in PostgreSQL."""

    __tablename__ = "schema_datasets"
    __table_args__ = (
        CheckConstraint(
            "role IN ('core', 'member')",
            name="ck_schema_datasets_role",
        ),
        CheckConstraint(
            "role != 'core' OR group_id IS NOT NULL",
            name="ck_schema_datasets_core_has_group",
        ),
        Index(
            "uq_schema_datasets_one_core_per_group",
            "group_id",
            unique=True,
            postgresql_where=text("role = 'core'"),
        ),
    )

    key: Mapped[str] = mapped_column(VARCHAR(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    role: Mapped[str] = mapped_column(
        VARCHAR(20), nullable=False, default="member", server_default="member"
    )
    group_id: Mapped[str | None] = mapped_column(
        ForeignKey("dataset_groups.id", ondelete="SET NULL"), nullable=True
    )
    group: Mapped["DatasetGroup | None"] = relationship(back_populates="datasets")
    current_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("schema_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    current_version: Mapped["SchemaVersion | None"] = relationship(
        foreign_keys=[current_version_id],
        post_update=True,
    )
    versions: Mapped[list["SchemaVersion"]] = relationship(
        back_populates="dataset",
        foreign_keys="SchemaVersion.dataset_id",
        order_by="SchemaVersion.version",
    )

    proposals: Mapped[list["SchemaProposal"]] = relationship(back_populates="dataset")


class SchemaVersion(BaseModel):
    __tablename__ = "schema_versions"
    __table_args__ = (
        UniqueConstraint(
            "dataset_id",
            "version",
            name="uq_schema_versions_dataset_version",
        ),
    )

    dataset_id: Mapped[str] = mapped_column(
        ForeignKey("schema_datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dataset: Mapped["SchemaDataset"] = relationship(
        back_populates="versions",
        foreign_keys=[dataset_id],
    )
    version: Mapped[int] = mapped_column(Integer(), nullable=False)
    source: Mapped[str] = mapped_column(VARCHAR(30), nullable=False)
    created_by_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    created_by_email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    proposal_id: Mapped[str | None] = mapped_column(
        ForeignKey("schema_proposals.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    columns: Mapped[list["SchemaVersionColumn"]] = relationship(
        back_populates="schema_version",
        cascade="all, delete-orphan",
        order_by="SchemaVersionColumn.ordinal_position",
    )


class SchemaVersionColumn(BaseModel):
    __tablename__ = "schema_version_columns"
    __table_args__ = (
        UniqueConstraint(
            "version_id",
            "name",
            name="uq_schema_version_columns_version_name",
        ),
    )

    version_id: Mapped[str] = mapped_column(
        ForeignKey("schema_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    schema_version: Mapped["SchemaVersion"] = relationship(back_populates="columns")
    ordinal_position: Mapped[int] = mapped_column(Integer(), nullable=False)
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    data_type: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    is_nullable: Mapped[bool | None] = mapped_column(Boolean(), nullable=True)
    is_important: Mapped[bool | None] = mapped_column(Boolean(), nullable=True)
    is_system_generated: Mapped[bool | None] = mapped_column(Boolean(), nullable=True)
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    primary_key: Mapped[bool | None] = mapped_column(Boolean(), nullable=True)
    partition_order: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    license: Mapped[str | None] = mapped_column(Text(), nullable=True)
    units: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    hint: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_mandatory: Mapped[bool | None] = mapped_column(Boolean(), nullable=True)
    is_unique: Mapped[bool | None] = mapped_column(Boolean(), nullable=True)
    domain_values: Mapped[str | None] = mapped_column(Text(), nullable=True)
    range_min: Mapped[float | None] = mapped_column(Float(), nullable=True)
    range_max: Mapped[float | None] = mapped_column(Float(), nullable=True)
    dynamic_max: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    precision_min: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    critical_for: Mapped[str | None] = mapped_column(VARCHAR(20), nullable=True)


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
    proposed_by_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    proposed_by_email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    schema_version: Mapped[int | None] = mapped_column(Integer(), nullable=True)
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
    actor_id: Mapped[str] = mapped_column(VARCHAR(36), nullable=False)
    actor_email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
