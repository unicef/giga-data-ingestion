"""'revise qos nullable fields'

Revision ID: 8014a5974b3c
Revises: 6bf3cdc59e0f
Create Date: 2024-05-07 18:53:13.501599

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8014a5974b3c"
down_revision: str | None = "6bf3cdc59e0f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        ALTER TYPE senddateinenum ADD VALUE 'NONE';
        COMMIT;

        BEGIN;

        ALTER TABLE qos_school_list
        ALTER COLUMN name DROP DEFAULT,
        ALTER COLUMN school_id_key DROP NOT NULL;

        ALTER TABLE qos_school_connectivity
        ALTER COLUMN ingestion_frequency SET NOT NULL,
        ALTER COLUMN send_date_in SET DEFAULT 'NONE'::senddateinenum,
        ALTER COLUMN school_id_key DROP NOT NULL;

        COMMIT; 
        """)
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        BEGIN;

        ALTER TABLE qos_school_connectivity
        ALTER COLUMN ingestion_frequency DROP NOT NULL,
        ALTER COLUMN send_date_in DROP DEFAULT,
        ALTER COLUMN school_id_key SET NOT NULL;

        ALTER TABLE qos_school_list
        ALTER COLUMN name SET DEFAULT '',
        ALTER COLUMN school_id_key SET NOT NULL;

        COMMIT;

        DROP TYPE senddateinenum;
        CREATE TYPE senddateinenum AS ENUM ('BODY', 'QUERY_PARAMETERS'); 
        """)
    )
