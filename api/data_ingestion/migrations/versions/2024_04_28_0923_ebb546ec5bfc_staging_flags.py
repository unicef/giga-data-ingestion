"""staging flags

Revision ID: ebb546ec5bfc
Revises: 2f90b0e32a2c
Create Date: 2024-04-28 09:23:21.850280

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ebb546ec5bfc"
down_revision: str | None = "2f90b0e32a2c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        ALTER TABLE file_uploads
        ADD COLUMN bronze_path TEXT DEFAULT NULL,
        ADD COLUMN is_processed_in_staging BOOLEAN DEFAULT false;
        """)
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        ALTER TABLE file_uploads
        DROP COLUMN bronze_path,
        DROP COLUMN is_processed_in_staging;
        """)
    )
