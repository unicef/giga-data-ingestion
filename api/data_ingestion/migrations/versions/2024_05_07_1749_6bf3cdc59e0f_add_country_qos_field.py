"""add country qos field

Revision ID: 6bf3cdc59e0f
Revises: 344bd96f226c
Create Date: 2024-05-07 17:49:56.241463

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6bf3cdc59e0f"
down_revision: str | None = "344bd96f226c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        BEGIN;

        ALTER TABLE qos_school_list
        ADD COLUMN country VARCHAR(3) NOT NULL DEFAULT 'BRA';

        ALTER TABLE qos_school_list
        ALTER COLUMN country DROP DEFAULT;

        COMMIT; 
        """)
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        ALTER TABLE qos_school_list
        DROP COLUMN country; 
        """)
    )
