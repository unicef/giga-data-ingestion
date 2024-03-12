"""'init file_uploads, qos_school_connectivity, and qos_school_list tables'

Revision ID: 361ab4c11911
Revises: 7f77cd6a7420
Create Date: 2024-03-12 10:52:48.757383

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "361ab4c11911"
down_revision: str | None = "7f77cd6a7420"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "file_uploads",
        sa.Column(
            "created",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("uploader_id", sa.VARCHAR(length=36), nullable=False),
        sa.Column("uploader_email", sa.String(), nullable=False),
        sa.Column("dq_report_path", sa.String(), nullable=True),
        sa.Column("country", sa.VARCHAR(length=3), nullable=False),
        sa.Column("dataset", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("original_filename", sa.String(), nullable=False),
        sa.Column(
            "column_to_schema_mapping", sa.JSON(), server_default="{}", nullable=False
        ),
        sa.Column("id", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_file_uploads_id"), "file_uploads", ["id"], unique=True)
    op.create_index(
        op.f("ix_file_uploads_uploader_id"),
        "file_uploads",
        ["uploader_id"],
        unique=False,
    )
    op.create_table(
        "qos_school_list",
        sa.Column(
            "column_to_schema_mapping", sa.JSON(), server_default="{}", nullable=False
        ),
        sa.Column("name", sa.String(), server_default="", nullable=False),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("api_auth_api_key", sa.String(), nullable=True),
        sa.Column("api_auth_api_value", sa.String(), nullable=True),
        sa.Column("api_endpoint", sa.String(), nullable=False),
        sa.Column(
            "authorization_type",
            sa.Enum(
                "BEARER_TOKEN",
                "BASIC_AUTH",
                "API_KEY",
                "NONE",
                name="authorizationtypeenum",
            ),
            nullable=False,
        ),
        sa.Column("basic_auth_password", sa.String(), nullable=True),
        sa.Column("basic_auth_username", sa.String(), nullable=True),
        sa.Column("bearer_auth_bearer_token", sa.String(), nullable=True),
        sa.Column("data_key", sa.String(), nullable=True),
        sa.Column(
            "date_created",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "date_modified",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "date_last_ingested",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "date_last_successfully_ingested",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("page_number_key", sa.String(), nullable=True),
        sa.Column("page_offset_key", sa.String(), nullable=True),
        sa.Column(
            "page_send_query_in",
            sa.Enum("BODY", "QUERY_PARAMETERS", "NONE", name="sendqueryinenum"),
            nullable=False,
        ),
        sa.Column("page_size_key", sa.String(), nullable=True),
        sa.Column("page_starts_with", sa.Integer(), nullable=True),
        sa.Column(
            "pagination_type",
            sa.Enum("PAGE_NUMBER", "LIMIT_OFFSET", "NONE", name="paginationtypeenum"),
            nullable=False,
        ),
        sa.Column("query_parameters", sa.JSON(), server_default="{}", nullable=True),
        sa.Column("request_body", sa.JSON(), server_default="{}", nullable=True),
        sa.Column(
            "request_method",
            sa.Enum("POST", "GET", name="requestmethodenum"),
            nullable=False,
        ),
        sa.Column("school_id_key", sa.String(), nullable=False),
        sa.Column(
            "school_id_send_query_in",
            sa.Enum("BODY", "QUERY_PARAMETERS", "NONE", name="sendqueryinenum"),
            nullable=False,
        ),
        sa.Column("size", sa.Integer(), nullable=True),
        sa.Column("id", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_qos_school_list_id"), "qos_school_list", ["id"], unique=True
    )
    op.create_table(
        "qos_school_connectivity",
        sa.Column("ingestion_frequency_minutes", sa.Integer(), nullable=False),
        sa.Column("schema_url", sa.String(), nullable=False),
        sa.Column("school_list_id", sa.String(), nullable=False),
        sa.Column("api_auth_api_key", sa.String(), nullable=True),
        sa.Column("api_auth_api_value", sa.String(), nullable=True),
        sa.Column("api_endpoint", sa.String(), nullable=False),
        sa.Column(
            "authorization_type",
            sa.Enum(
                "BEARER_TOKEN",
                "BASIC_AUTH",
                "API_KEY",
                "NONE",
                name="authorizationtypeenum",
            ),
            nullable=False,
        ),
        sa.Column("basic_auth_password", sa.String(), nullable=True),
        sa.Column("basic_auth_username", sa.String(), nullable=True),
        sa.Column("bearer_auth_bearer_token", sa.String(), nullable=True),
        sa.Column("data_key", sa.String(), nullable=True),
        sa.Column(
            "date_created",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "date_modified",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "date_last_ingested",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "date_last_successfully_ingested",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("page_number_key", sa.String(), nullable=True),
        sa.Column("page_offset_key", sa.String(), nullable=True),
        sa.Column(
            "page_send_query_in",
            sa.Enum("BODY", "QUERY_PARAMETERS", "NONE", name="sendqueryinenum"),
            nullable=False,
        ),
        sa.Column("page_size_key", sa.String(), nullable=True),
        sa.Column("page_starts_with", sa.Integer(), nullable=True),
        sa.Column(
            "pagination_type",
            sa.Enum("PAGE_NUMBER", "LIMIT_OFFSET", "NONE", name="paginationtypeenum"),
            nullable=False,
        ),
        sa.Column("query_parameters", sa.JSON(), server_default="{}", nullable=True),
        sa.Column("request_body", sa.JSON(), server_default="{}", nullable=True),
        sa.Column(
            "request_method",
            sa.Enum("POST", "GET", name="requestmethodenum"),
            nullable=False,
        ),
        sa.Column("school_id_key", sa.String(), nullable=False),
        sa.Column(
            "school_id_send_query_in",
            sa.Enum("BODY", "QUERY_PARAMETERS", "NONE", name="sendqueryinenum"),
            nullable=False,
        ),
        sa.Column("size", sa.Integer(), nullable=True),
        sa.Column("id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["school_list_id"],
            ["qos_school_list.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_qos_school_connectivity_id"),
        "qos_school_connectivity",
        ["id"],
        unique=True,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(
        op.f("ix_qos_school_connectivity_id"), table_name="qos_school_connectivity"
    )
    op.drop_table("qos_school_connectivity")
    op.drop_index(op.f("ix_qos_school_list_id"), table_name="qos_school_list")
    op.drop_table("qos_school_list")
    op.drop_index(op.f("ix_file_uploads_uploader_id"), table_name="file_uploads")
    op.drop_index(op.f("ix_file_uploads_id"), table_name="file_uploads")
    op.drop_table("file_uploads")
    op.execute("DROP TYPE IF EXISTS authorizationtypeenum")
    op.execute("DROP TYPE IF EXISTS paginationtypeenum")
    op.execute("DROP TYPE IF EXISTS requestmethodenum")
    op.execute("DROP TYPE IF EXISTS sendqueryinenum")
    # ### end Alembic commands ###
