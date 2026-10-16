"""Store immutable schema versions in PostgreSQL

Revision ID: 9c4d8e1f2a6b
Revises: 5a7e9c2d4b6f
Create Date: 2026-10-16 09:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "9c4d8e1f2a6b"
down_revision: str | None = "5a7e9c2d4b6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "schema_proposals",
        "delta_version",
        new_column_name="schema_version",
        existing_type=sa.Integer(),
    )

    op.create_table(
        "schema_versions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("dataset_id", sa.String(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("source", sa.VARCHAR(length=30), nullable=False),
        sa.Column("created_by_id", sa.VARCHAR(length=36), nullable=False),
        sa.Column("created_by_email", sa.VARCHAR(length=255), nullable=False),
        sa.Column("proposal_id", sa.String(), nullable=True),
        sa.Column(
            "created",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["dataset_id"], ["schema_datasets.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["proposal_id"], ["schema_proposals.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("proposal_id"),
        sa.UniqueConstraint(
            "dataset_id",
            "version",
            name="uq_schema_versions_dataset_version",
        ),
    )
    op.create_index(
        op.f("ix_schema_versions_id"), "schema_versions", ["id"], unique=True
    )
    op.create_index(
        op.f("ix_schema_versions_dataset_id"),
        "schema_versions",
        ["dataset_id"],
        unique=False,
    )

    op.create_table(
        "schema_version_columns",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("version_id", sa.String(), nullable=False),
        sa.Column("ordinal_position", sa.Integer(), nullable=False),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("data_type", sa.VARCHAR(length=50), nullable=False),
        sa.Column("is_nullable", sa.Boolean(), nullable=True),
        sa.Column("is_important", sa.Boolean(), nullable=True),
        sa.Column("is_system_generated", sa.Boolean(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("primary_key", sa.Boolean(), nullable=True),
        sa.Column("partition_order", sa.Integer(), nullable=True),
        sa.Column("license", sa.Text(), nullable=True),
        sa.Column("units", sa.VARCHAR(length=100), nullable=True),
        sa.Column("hint", sa.Text(), nullable=True),
        sa.Column("is_mandatory", sa.Boolean(), nullable=True),
        sa.Column("is_unique", sa.Boolean(), nullable=True),
        sa.Column("domain_values", sa.Text(), nullable=True),
        sa.Column("range_min", sa.Float(), nullable=True),
        sa.Column("range_max", sa.Float(), nullable=True),
        sa.Column("dynamic_max", sa.VARCHAR(length=255), nullable=True),
        sa.Column("precision_min", sa.Integer(), nullable=True),
        sa.Column("critical_for", sa.VARCHAR(length=20), nullable=True),
        sa.ForeignKeyConstraint(
            ["version_id"], ["schema_versions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "version_id",
            "name",
            name="uq_schema_version_columns_version_name",
        ),
    )
    op.create_index(
        op.f("ix_schema_version_columns_id"),
        "schema_version_columns",
        ["id"],
        unique=True,
    )
    op.create_index(
        op.f("ix_schema_version_columns_version_id"),
        "schema_version_columns",
        ["version_id"],
        unique=False,
    )

    op.add_column(
        "schema_datasets",
        sa.Column("current_version_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_schema_datasets_current_version_id",
        "schema_datasets",
        "schema_versions",
        ["current_version_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_schema_datasets_current_version_id",
        "schema_datasets",
        type_="foreignkey",
    )
    op.drop_column("schema_datasets", "current_version_id")
    op.drop_index(
        op.f("ix_schema_version_columns_version_id"),
        table_name="schema_version_columns",
    )
    op.drop_index(
        op.f("ix_schema_version_columns_id"),
        table_name="schema_version_columns",
    )
    op.drop_table("schema_version_columns")
    op.drop_index(op.f("ix_schema_versions_dataset_id"), table_name="schema_versions")
    op.drop_index(op.f("ix_schema_versions_id"), table_name="schema_versions")
    op.drop_table("schema_versions")
    op.alter_column(
        "schema_proposals",
        "schema_version",
        new_column_name="delta_version",
        existing_type=sa.Integer(),
    )
