"""Pin resolved schema versions on file uploads

Revision ID: 5a7e9c2d4b6f
Revises: 8f3c2a1b7d4e
Create Date: 2026-10-15 13:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "5a7e9c2d4b6f"
down_revision: str | None = "8f3c2a1b7d4e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "file_uploads",
        sa.Column("schema_key", sa.VARCHAR(length=100), nullable=True),
    )
    op.add_column(
        "file_uploads",
        sa.Column("schema_version", sa.Integer(), nullable=True),
    )
    op.add_column(
        "file_uploads",
        sa.Column("core_schema_key", sa.VARCHAR(length=100), nullable=True),
    )
    op.add_column(
        "file_uploads",
        sa.Column("core_schema_version", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("file_uploads", "core_schema_version")
    op.drop_column("file_uploads", "core_schema_key")
    op.drop_column("file_uploads", "schema_version")
    op.drop_column("file_uploads", "schema_key")
