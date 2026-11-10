"""Add source field to schema version columns

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-11-04 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e2f3a4b5c6d7"
down_revision: str | None = "d1e2f3a4b5c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "schema_version_columns",
        sa.Column("source", sa.VARCHAR(length=30), nullable=True),
    )
    # Backfill from the existing boolean for columns that already mark
    # system-generated status.
    op.execute(
        """
        UPDATE schema_version_columns
        SET source = 'system_generated'
        WHERE is_system_generated IS TRUE AND source IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("schema_version_columns", "source")
