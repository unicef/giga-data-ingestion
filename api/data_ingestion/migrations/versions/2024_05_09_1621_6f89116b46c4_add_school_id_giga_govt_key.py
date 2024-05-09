"""add school_id_giga_govt key

Revision ID: 6f89116b46c4
Revises: 8014a5974b3c
Create Date: 2024-05-09 16:21:48.877238

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6f89116b46c4"
down_revision: str | None = "8014a5974b3c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
        BEGIN;

        ALTER TABLE qos_school_connectivity
        DROP CONSTRAINT date_key_conditional_not_null;

        UPDATE qos_school_connectivity
        SET send_date_in = 'NONE'::senddateinenum
        WHERE send_date_in IS NULL;

        ALTER TABLE qos_school_connectivity
        ADD CONSTRAINT date_key_conditional_not_null
        CHECK (
            (date_key IS NULL AND date_format IS NULL AND
             send_date_in = 'NONE'::senddateinenum)
            OR
            (date_key IS NOT NULL AND date_format IS NOT NULL AND
             send_date_in != 'NONE'::senddateinenum)
        );

        ALTER TABLE qos_school_connectivity
        ADD COLUMN has_school_id_giga BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN school_id_giga_govt_key TEXT NOT NULL DEFAULT 'school_id_giga';

        COMMIT;
        """
        )
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
        ALTER TABLE qos_school_connectivity
        DROP COLUMN has_school_id_giga,
        DROP COLUMN school_id_giga_govt_key;
        """
        )
    )
