"""dq status

Revision ID: 46ceba139287
Revises: d2d8fbb743bb
Create Date: 2024-05-02 15:27:13.709903

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "46ceba139287"
down_revision: str | None = "d2d8fbb743bb"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        BEGIN;

        CREATE TYPE dqstatusenum AS ENUM (
            'IN_PROGRESS',
            'COMPLETED',
            'ERROR',
            'TIMEOUT',
            'SKIPPED'
        );

        ALTER TABLE file_uploads
        ADD COLUMN dq_status dqstatusenum NOT NULL DEFAULT 'IN_PROGRESS';

        UPDATE file_uploads
        SET
            dq_status = CASE WHEN dq_report_path IS NULL
                THEN CASE WHEN dataset = 'unstructured'
                    THEN 'SKIPPED'::dqstatusenum
                    ELSE CASE WHEN created < current_timestamp - INTERVAL '1 hour'
                        THEN 'TIMEOUT'::dqstatusenum
                        ELSE 'IN_PROGRESS'::dqstatusenum
                        END
                    END
                ELSE 'COMPLETED'::dqstatusenum
            END;

        COMMIT;
        """)
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        BEGIN;

        ALTER TABLE file_uploads
        DROP COLUMN dq_status;

        DROP TYPE dqstatusenum;

        COMMIT;
        """)
    )
