"""full dq report path

Revision ID: d2d8fbb743bb
Revises: ebb546ec5bfc
Create Date: 2024-04-28 09:58:42.276121

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d2d8fbb743bb"
down_revision: str | None = "ebb546ec5bfc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(
        sa.text("""
        BEGIN;
        
        ALTER TABLE file_uploads
        ADD COLUMN dq_full_path TEXT DEFAULT NULL;
        
        UPDATE file_uploads
        SET dq_full_path = REPLACE(dq_report_path, '/dq-summary/', '/dq-overall/');

        COMMIT;
        """)
    )


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(
        sa.text("""
        ALTER TABLE file_uploads
        DROP COLUMN dq_full_path;
        """)
    )
