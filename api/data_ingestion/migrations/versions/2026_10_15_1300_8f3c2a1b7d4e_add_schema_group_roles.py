"""Add schema group roles and display metadata

Revision ID: 8f3c2a1b7d4e
Revises: 4baa07aa81cd
Create Date: 2026-10-15 13:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "8f3c2a1b7d4e"
down_revision: str | None = "4baa07aa81cd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "schema_datasets",
        sa.Column("name", sa.String(), nullable=True),
    )
    op.add_column(
        "schema_datasets",
        sa.Column("description", sa.Text(), nullable=True),
    )
    op.add_column(
        "schema_datasets",
        sa.Column(
            "role",
            sa.VARCHAR(length=20),
            server_default="member",
            nullable=False,
        ),
    )

    # Existing registry rows become member schemas. Their display names can be
    # refined later without changing the stable Delta table key.
    op.execute(
        sa.text(
            "UPDATE schema_datasets "
            "SET name = initcap(replace(key, '_', ' ')) "
            "WHERE name IS NULL"
        )
    )
    op.alter_column("schema_datasets", "name", nullable=False)

    op.create_check_constraint(
        "ck_schema_datasets_role",
        "schema_datasets",
        "role IN ('core', 'member')",
    )
    op.create_check_constraint(
        "ck_schema_datasets_core_has_group",
        "schema_datasets",
        "role != 'core' OR group_id IS NOT NULL",
    )
    op.create_index(
        "uq_schema_datasets_one_core_per_group",
        "schema_datasets",
        ["group_id"],
        unique=True,
        postgresql_where=sa.text("role = 'core'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_schema_datasets_one_core_per_group",
        table_name="schema_datasets",
    )
    op.drop_constraint(
        "ck_schema_datasets_core_has_group",
        "schema_datasets",
        type_="check",
    )
    op.drop_constraint(
        "ck_schema_datasets_role",
        "schema_datasets",
        type_="check",
    )
    op.drop_column("schema_datasets", "role")
    op.drop_column("schema_datasets", "description")
    op.drop_column("schema_datasets", "name")
