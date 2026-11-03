"""Add schema lifecycle and coordinated promotion targets

Revision ID: d1e2f3a4b5c6
Revises: 9c4d8e1f2a6b
Create Date: 2026-11-03 15:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d1e2f3a4b5c6"
down_revision: str | None = "9c4d8e1f2a6b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _add_archive_columns(table_name: str) -> None:
    op.add_column(
        table_name,
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        table_name,
        sa.Column("archived_by_id", sa.VARCHAR(length=36), nullable=True),
    )
    op.add_column(
        table_name,
        sa.Column("archived_by_email", sa.VARCHAR(length=255), nullable=True),
    )
    op.add_column(table_name, sa.Column("archive_reason", sa.Text(), nullable=True))


def upgrade() -> None:
    _add_archive_columns("dataset_groups")
    _add_archive_columns("schema_datasets")
    op.drop_index(
        "uq_schema_datasets_one_core_per_group",
        table_name="schema_datasets",
    )
    op.create_index(
        "uq_schema_datasets_one_core_per_group",
        "schema_datasets",
        ["group_id"],
        unique=True,
        postgresql_where=sa.text("role = 'core' AND archived_at IS NULL"),
    )

    op.drop_constraint(
        "schema_versions_proposal_id_key",
        "schema_versions",
        type_="unique",
    )

    op.create_table(
        "schema_proposal_targets",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("proposal_id", sa.String(), nullable=False),
        sa.Column("dataset_id", sa.String(), nullable=False),
        sa.Column("operation", sa.VARCHAR(length=20), nullable=False),
        sa.Column("expected_version", sa.Integer(), nullable=True),
        sa.Column("before_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(
            ["proposal_id"], ["schema_proposals.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["dataset_id"], ["schema_datasets.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "proposal_id",
            "dataset_id",
            name="uq_schema_proposal_targets_proposal_dataset",
        ),
    )
    op.create_index(
        op.f("ix_schema_proposal_targets_id"),
        "schema_proposal_targets",
        ["id"],
        unique=True,
    )
    op.create_index(
        op.f("ix_schema_proposal_targets_proposal_id"),
        "schema_proposal_targets",
        ["proposal_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_schema_proposal_targets_dataset_id"),
        "schema_proposal_targets",
        ["dataset_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_schema_proposal_targets_dataset_id"),
        table_name="schema_proposal_targets",
    )
    op.drop_index(
        op.f("ix_schema_proposal_targets_proposal_id"),
        table_name="schema_proposal_targets",
    )
    op.drop_index(
        op.f("ix_schema_proposal_targets_id"),
        table_name="schema_proposal_targets",
    )
    op.drop_table("schema_proposal_targets")

    op.create_unique_constraint(
        "schema_versions_proposal_id_key",
        "schema_versions",
        ["proposal_id"],
    )
    op.drop_index(
        "uq_schema_datasets_one_core_per_group",
        table_name="schema_datasets",
    )
    op.create_index(
        "uq_schema_datasets_one_core_per_group",
        "schema_datasets",
        ["group_id"],
        unique=True,
        postgresql_where=sa.text("role = 'core'"),
    )

    for table_name in ("schema_datasets", "dataset_groups"):
        op.drop_column(table_name, "archive_reason")
        op.drop_column(table_name, "archived_by_email")
        op.drop_column(table_name, "archived_by_id")
        op.drop_column(table_name, "archived_at")
