"""add upload row stats and data owner

Revision ID: b1c2d3e4f5a6
Revises: c4e5f6a7b8c9
Create Date: 2026-04-28 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: str | None = "c4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("file_uploads", sa.Column("data_owner", sa.String(), nullable=True))
    op.add_column("file_uploads", sa.Column("rows", sa.Integer(), nullable=True))
    op.add_column("file_uploads", sa.Column("rows_passed", sa.Integer(), nullable=True))
    op.add_column("file_uploads", sa.Column("rows_failed", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("file_uploads", "rows_failed")
    op.drop_column("file_uploads", "rows_passed")
    op.drop_column("file_uploads", "rows")
    op.drop_column("file_uploads", "data_owner")
