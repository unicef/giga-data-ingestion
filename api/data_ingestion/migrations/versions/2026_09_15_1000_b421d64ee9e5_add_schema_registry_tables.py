"""Add schema registry tables: dataset_groups, schema_datasets, schema_dataset_links, schema_proposals, schema_proposal_audit_log

Revision ID: b421d64ee9e5
Revises: f2a3b4c5d6e7
Create Date: 2026-09-15 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b421d64ee9e5"
down_revision: str | None = "f2a3b4c5d6e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "dataset_groups",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("key", sa.VARCHAR(length=100), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index(
        op.f("ix_dataset_groups_id"), "dataset_groups", ["id"], unique=True
    )

    op.create_table(
        "schema_datasets",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("key", sa.VARCHAR(length=100), nullable=False),
        sa.Column("group_id", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["group_id"], ["dataset_groups.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index(
        op.f("ix_schema_datasets_id"), "schema_datasets", ["id"], unique=True
    )

    op.create_table(
        "schema_dataset_links",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("dataset_id", sa.String(), nullable=False),
        sa.Column("linked_dataset_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["dataset_id"], ["schema_datasets.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["linked_dataset_id"], ["schema_datasets.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "dataset_id", "linked_dataset_id", name="uq_dataset_linked_dataset"
        ),
    )
    op.create_index(
        op.f("ix_schema_dataset_links_id"), "schema_dataset_links", ["id"], unique=True
    )

    op.create_table(
        "schema_proposals",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("dataset_id", sa.String(), nullable=False),
        sa.Column("column_name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("proposal_type", sa.VARCHAR(length=20), nullable=False),
        sa.Column(
            "status",
            sa.VARCHAR(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("before_state", postgresql.JSONB(), nullable=True),
        sa.Column("after_state", postgresql.JSONB(), nullable=True),
        sa.Column("proposed_by_id", sa.VARCHAR(length=36), nullable=False),
        sa.Column("proposed_by_email", sa.VARCHAR(length=255), nullable=False),
        sa.Column("delta_version", sa.Integer(), nullable=True),
        sa.Column("apply_error", sa.Text(), nullable=True),
        sa.Column(
            "created",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["dataset_id"], ["schema_datasets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_schema_proposals_id"), "schema_proposals", ["id"], unique=True
    )

    op.create_table(
        "schema_proposal_audit_log",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("proposal_id", sa.String(), nullable=False),
        sa.Column("action", sa.VARCHAR(length=20), nullable=False),
        sa.Column("actor_id", sa.VARCHAR(length=36), nullable=False),
        sa.Column("actor_email", sa.VARCHAR(length=255), nullable=False),
        sa.Column(
            "created",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["proposal_id"], ["schema_proposals.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_schema_proposal_audit_log_id"),
        "schema_proposal_audit_log",
        ["id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_schema_proposal_audit_log_id"),
        table_name="schema_proposal_audit_log",
    )
    op.drop_table("schema_proposal_audit_log")

    op.drop_index(op.f("ix_schema_proposals_id"), table_name="schema_proposals")
    op.drop_table("schema_proposals")

    op.drop_index(
        op.f("ix_schema_dataset_links_id"), table_name="schema_dataset_links"
    )
    op.drop_table("schema_dataset_links")

    op.drop_index(op.f("ix_schema_datasets_id"), table_name="schema_datasets")
    op.drop_table("schema_datasets")

    op.drop_index(op.f("ix_dataset_groups_id"), table_name="dataset_groups")
    op.drop_table("dataset_groups")
