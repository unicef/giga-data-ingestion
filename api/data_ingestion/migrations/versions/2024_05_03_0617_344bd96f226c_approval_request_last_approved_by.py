"""approval request last approved by

Revision ID: 344bd96f226c
Revises: 46ceba139287
Create Date: 2024-05-03 06:17:46.520828

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "344bd96f226c"
down_revision: str | None = "46ceba139287"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        ALTER TABLE approval_requests
        ADD COLUMN last_approved_by_id VARCHAR(36),
        ADD COLUMN last_approved_by_email VARCHAR(255);
        """)
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        ALTER TABLE approval_requests
        DROP COLUMN last_approved_by_id,
        DROP COLUMN last_approved_by_email;
        """)
    )
