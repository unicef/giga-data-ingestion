"""'add date_key and date_format'

Revision ID: fa5a528b0af0
Revises: 92088e51ad75
Create Date: 2024-04-10 08:09:48.113577

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "fa5a528b0af0"
down_revision: str | None = "92088e51ad75"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###

    send_date_in = postgresql.ENUM("BODY", "QUERY_PARAMETERS", name="senddateinenum")
    send_date_in.create(op.get_bind())

    op.add_column(
        "qos_school_connectivity", sa.Column("date_key", sa.String(), nullable=True)
    )
    op.add_column(
        "qos_school_connectivity", sa.Column("date_format", sa.String(), nullable=True)
    )
    op.add_column(
        "qos_school_connectivity",
        sa.Column(
            "send_date_in",
            sa.Enum("BODY", "QUERY_PARAMETERS", name="senddateinenum"),
            nullable=True,
        ),
    )
    op.add_column(
        "qos_school_connectivity",
        sa.Column("response_date_key", sa.String(), nullable=False, server_default=""),
    )
    op.add_column(
        "qos_school_connectivity",
        sa.Column(
            "response_date_format",
            sa.String(),
            nullable=False,
            server_default="%Y-%m-%d",
        ),
    )

    op.execute(
        "ALTER TABLE qos_school_connectivity "
        "ADD CONSTRAINT date_key_conditional_not_null "
        "CHECK ("
        "(date_key IS NULL AND date_format IS NULL AND send_date_in IS NULL) "
        "OR "
        "(date_key IS NOT NULL AND date_format IS NOT NULL AND send_date_in IS NOT NULL)"
        ");"
    )


# ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("qos_school_connectivity", "response_date_format")
    op.drop_column("qos_school_connectivity", "response_date_key")
    op.drop_column("qos_school_connectivity", "send_date_in")
    op.drop_column("qos_school_connectivity", "date_format")
    op.drop_column("qos_school_connectivity", "date_key")
    send_date_in = postgresql.ENUM("BODY", "QUERY_PARAMETERS", name="senddateinenum")
    send_date_in.drop(op.get_bind())

    op.execute(
        "ALTER TABLE qos_school_connectivity "
        "DROP CONSTRAINT IF EXISTS date_key_conditional_not_null;"
    )

    # ### end Alembic commands ###
