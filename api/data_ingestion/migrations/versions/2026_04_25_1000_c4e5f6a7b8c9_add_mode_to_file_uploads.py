"""add mode to file_uploads

Revision ID: c4e5f6a7b8c9
Revises: a3c6ab14b3f8
Create Date: 2026-04-25 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4e5f6a7b8c9"
down_revision: str | None = "a3c6ab14b3f8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("file_uploads", sa.Column("mode", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("file_uploads", "mode")
