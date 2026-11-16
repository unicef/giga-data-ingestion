"""Add column_group; drop partition_order from schema columns

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-11-13 15:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f3a4b5c6d7e8"
down_revision: str | None = "e2f3a4b5c6d7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "schema_version_columns",
        sa.Column("column_group", sa.VARCHAR(length=100), nullable=True),
    )
    op.drop_column("schema_version_columns", "partition_order")


def downgrade() -> None:
    op.add_column(
        "schema_version_columns",
        sa.Column("partition_order", sa.Integer(), nullable=True),
    )
    op.drop_column("schema_version_columns", "column_group")
