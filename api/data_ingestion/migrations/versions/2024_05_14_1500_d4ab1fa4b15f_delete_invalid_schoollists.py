"""delete_invalid_schoolLists

Revision ID: d4ab1fa4b15f
Revises: 59aabe1df309
Create Date: 2024-05-14 15:00:21.455569

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4ab1fa4b15f"
down_revision: str | None = "59aabe1df309"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(
        sa.text(
            """
        DELETE FROM qos_school_list
        WHERE id IN (
            SELECT qos_school_list.id
            FROM qos_school_list
            LEFT OUTER JOIN qos_school_connectivity
            ON qos_school_list.id = qos_school_connectivity.school_list_id
            WHERE qos_school_connectivity.id IS NULL
        )
        """
        )
    )

    pass


def downgrade() -> None:
    pass
