"""Add rejection_reason column to schema_proposals

Revision ID: 4baa07aa81cd
Revises: b421d64ee9e5
Create Date: 2026-09-21 11:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4baa07aa81cd"
down_revision: str | None = "b421d64ee9e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "schema_proposals",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("schema_proposals", "rejection_reason")
