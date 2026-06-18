"""Add columns to deletion_requests: original_filename, id_type, school_count, file_path, raw_file_path, is_delete_all, status

Revision ID: f2a3b4c5d6e7
Revises: 7b89fb20822f
Create Date: 2026-06-17 00:01:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f2a3b4c5d6e7"
down_revision: str | None = "7b89fb20822f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    existing = {c["name"] for c in sa.inspect(conn).get_columns("deletion_requests")}
    if "original_filename" not in existing:
        op.add_column(
            "deletion_requests", sa.Column("original_filename", sa.String(), nullable=True)
        )
    if "id_type" not in existing:
        op.add_column(
            "deletion_requests", sa.Column("id_type", sa.VARCHAR(20), nullable=True)
        )
    if "school_count" not in existing:
        op.add_column(
            "deletion_requests", sa.Column("school_count", sa.Integer(), nullable=True)
        )
    if "file_path" not in existing:
        op.add_column(
            "deletion_requests", sa.Column("file_path", sa.String(), nullable=True)
        )
    if "raw_file_path" not in existing:
        op.add_column(
            "deletion_requests", sa.Column("raw_file_path", sa.String(), nullable=True)
        )
    if "is_delete_all" not in existing:
        op.add_column(
            "deletion_requests", sa.Column("is_delete_all", sa.Boolean(), nullable=True)
        )
    if "status" not in existing:
        op.add_column(
            "deletion_requests",
            sa.Column("status", sa.VARCHAR(20), nullable=True, server_default="PROCESSING"),
        )


def downgrade() -> None:
    op.drop_column("deletion_requests", "status")
    op.drop_column("deletion_requests", "is_delete_all")
    op.drop_column("deletion_requests", "raw_file_path")
    op.drop_column("deletion_requests", "file_path")
    op.drop_column("deletion_requests", "school_count")
    op.drop_column("deletion_requests", "id_type")
    op.drop_column("deletion_requests", "original_filename")
