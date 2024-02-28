"""'update enums'

Revision ID: f1daf3173765
Revises: 53de7b5296ee
Create Date: 2024-02-28 01:25:34.952112

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1daf3173765"
down_revision: str | None = "53de7b5296ee"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.execute("CREATE TYPE temp_enum_type AS ENUM('BODY', 'QUERY_PARAMETERS','NONE')")
    op.alter_column(
        "qos_school_list",
        "send_query_in",
        type_=sa.Text(),
        postgresql_using="send_query_in::text",
    )
    op.alter_column(
        "qos_school_list",
        "send_query_in",
        type_=sa.Enum("BODY", "QUERY_PARAMETERS", "NONE", name="temp_enum_type"),
        postgresql_using="send_query_in::temp_enum_type",
    )
    op.execute("DROP TYPE sendqueryinenum")
    op.execute("ALTER TYPE temp_enum_type RENAME TO sendqueryinenum")

    # AuthorizationTypeEnum
    op.execute(
        "CREATE TYPE temp_enum_type AS ENUM('API_KEY', 'BASIC_AUTH',"
        "'BEARER_TOKEN','NONE')"
    )
    op.alter_column(
        "qos_school_list",
        "authorization_type",
        type_=sa.Text(),
        postgresql_using="authorization_type::text",
    )
    op.alter_column(
        "qos_school_list",
        "authorization_type",
        type_=sa.Enum(
            "API_KEY", "BASIC_AUTH", "BEARER_TOKEN", "NONE", name="temp_enum_type"
        ),
        postgresql_using="authorization_type::temp_enum_type",
    )
    op.execute("DROP TYPE authorizationtypeenum")
    op.execute("ALTER TYPE temp_enum_type RENAME TO authorizationtypeenum")

    # PaginationTypeEnum
    op.execute(
        "CREATE TYPE temp_enum_type AS ENUM('PAGE_NUMBER', 'LIMIT_OFFSET'," "'NONE')"
    )
    op.alter_column(
        "qos_school_list",
        "pagination_type",
        type_=sa.Text(),
        postgresql_using="pagination_type::text",
    )
    op.alter_column(
        "qos_school_list",
        "pagination_type",
        type_=sa.Enum("PAGE_NUMBER", "LIMIT_OFFSET", "NONE", name="temp_enum_type"),
        postgresql_using="pagination_type::temp_enum_type",
    )
    op.execute("DROP TYPE paginationtypeenum")
    op.execute("ALTER TYPE temp_enum_type RENAME TO paginationtypeenum")

    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###

    op.execute(
        "CREATE TYPE temp_enum_type AS ENUM('BODY', 'QUERY_PARAMETERS', 'HEADERS')"
    )
    op.alter_column(
        "qos_school_list",
        "send_query_in",
        type_=sa.Text(),
        postgresql_using="send_query_in::text",
    )
    op.alter_column(
        "qos_school_list",
        "send_query_in",
        type_=sa.Enum("BODY", "QUERY_PARAMETERS", "HEADERS", name="temp_enum_type"),
        postgresql_using="send_query_in::temp_enum_type",
    )
    op.execute("DROP TYPE sendqueryinenum")
    op.execute("ALTER TYPE temp_enum_type RENAME TO sendqueryinenum")

    # AuthorizationTypeEnum
    op.execute(
        "CREATE TYPE temp_enum_type AS ENUM('BEARER_TOKEN', 'BASIC_AUTH', 'API_KEY')"
    )
    op.alter_column(
        "qos_school_list",
        "authorization_type",
        type_=sa.Text(),
        postgresql_using="authorization_type::text",
    )
    op.alter_column(
        "qos_school_list",
        "authorization_type",
        type_=sa.Enum("BEARER_TOKEN", "BASIC_AUTH", "API_KEY", name="temp_enum_type"),
        postgresql_using="authorization_type::temp_enum_type",
    )
    op.execute("DROP TYPE authorizationtypeenum")
    op.execute("ALTER TYPE temp_enum_type RENAME TO authorizationtypeenum")

    # PaginationTypeEnum
    op.execute("CREATE TYPE temp_enum_type AS ENUM('PAGE_NUMBER', 'LIMIT_OFFSET')")
    op.alter_column(
        "qos_school_list",
        "pagination_type",
        type_=sa.Text(),
        postgresql_using="pagination_type::text",
    )
    op.alter_column(
        "qos_school_list",
        "pagination_type",
        type_=sa.Enum("PAGE_NUMBER", "LIMIT_OFFSET", name="temp_enum_type"),
        postgresql_using="pagination_type::temp_enum_type",
    )
    op.execute("DROP TYPE paginationtypeenum")
    op.execute("ALTER TYPE temp_enum_type RENAME TO paginationtypeenum")

    pass
    # ### end Alembic commands ###
