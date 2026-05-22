"""Add FILE_CHECKED to dqstatusenum

Revision ID: a1b2c3d4e5f6
Revises: 49a684bb43f3
Create Date: 2026-05-21 18:10:00.000000

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "49a684bb43f3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Postgres requires ALTER TYPE ... ADD VALUE to run outside a transaction.
    # We commit the surrounding transaction first, run the ADD VALUE, then continue.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE dqstatusenum ADD VALUE IF NOT EXISTS 'FILE_CHECKED'")


def downgrade() -> None:
    # Postgres does not support removing a value from an enum type without
    # recreating the type. We rebuild the type with the original values and
    # cast existing rows that may have FILE_CHECKED to IN_PROGRESS.
    op.execute("ALTER TYPE dqstatusenum RENAME TO dqstatusenum_old")
    op.execute(
        """
        CREATE TYPE dqstatusenum AS ENUM (
            'IN_PROGRESS',
            'COMPLETED',
            'ERROR',
            'TIMEOUT',
            'SKIPPED'
        )
        """
    )
    op.execute(
        """
        ALTER TABLE file_uploads
            ALTER COLUMN dq_status DROP DEFAULT,
            ALTER COLUMN dq_status TYPE dqstatusenum USING (
                CASE
                    WHEN dq_status::text = 'FILE_CHECKED' THEN 'IN_PROGRESS'
                    ELSE dq_status::text
                END
            )::dqstatusenum,
            ALTER COLUMN dq_status SET DEFAULT 'IN_PROGRESS'
        """
    )
    op.execute("DROP TYPE dqstatusenum_old")
