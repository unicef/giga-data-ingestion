"""'approval request audit log'

Revision ID: 40db295f0ae5
Revises: 6f89116b46c4
Create Date: 2024-05-12 12:49:12.633514

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "40db295f0ae5"
down_revision: str | None = "6f89116b46c4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "approval_request_audit_log",
        sa.Column("approval_request_id", sa.String(), nullable=False),
        sa.Column("approved_by_id", sa.VARCHAR(length=36), nullable=False),
        sa.Column("approved_by_email", sa.VARCHAR(length=255), nullable=False),
        sa.Column(
            "approved_date",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["approval_request_id"],
            ["approval_requests.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_approval_request_audit_log_id"),
        "approval_request_audit_log",
        ["id"],
        unique=True,
    )
    op.add_column(
        "approval_requests",
        sa.Column(
            "is_merge_processing",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.drop_column("approval_requests", "last_approved_by_id")
    op.drop_column("approval_requests", "last_approved_by_email")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "approval_requests",
        sa.Column(
            "last_approved_by_email",
            sa.VARCHAR(length=255),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "approval_requests",
        sa.Column(
            "last_approved_by_id",
            sa.VARCHAR(length=36),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.drop_column("approval_requests", "is_merge_processing")
    op.drop_index(
        op.f("ix_approval_request_audit_log_id"),
        table_name="approval_request_audit_log",
    )
    op.drop_table("approval_request_audit_log")
    # ### end Alembic commands ###
