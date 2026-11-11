"""One-time DDL migration: add the DQ-config columns (previously only in
NocoDB) onto every existing Delta `schemas.<dataset>` table, and extend the
Delta log/file retention so the version history this feature relies on isn't
silently pruned by the defaults (30-day log retention, 7-day VACUUM).

Not run automatically — review the target Trino/Delta version's support for
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `SET TBLPROPERTIES` before
running this against real infrastructure.

Usage: python -m scripts.extend_schema_tables
"""

from data_ingestion.db.trino import get_db_context
from loguru import logger
from sqlalchemy import column, literal, select, text

NEW_COLUMNS = [
    ("is_mandatory", "boolean"),
    ("is_unique", "boolean"),
    ("domain_values", "varchar"),
    ("range_min", "double"),
    ("range_max", "double"),
    ("dynamic_max", "varchar"),
    ("precision_min", "integer"),
    ("critical_for", "varchar"),
]

RETENTION_PROPERTIES = {
    "delta.logRetentionDuration": "interval 3650 days",
    "delta.deletedFileRetentionDuration": "interval 3650 days",
}


def main():
    with get_db_context() as db:
        tables = [
            row["table_name"]
            for row in db.execute(
                select("*")
                .select_from(text("information_schema.tables"))
                .where(column("table_schema") == literal("schemas"))
                .order_by(column("table_name"))
            )
            .mappings()
            .all()
        ]

        logger.info(f"Extending {len(tables)} schemas.* tables: {tables}")

        for table in tables:
            for name, sql_type in NEW_COLUMNS:
                logger.info(f"schemas.{table}: adding column {name} ({sql_type})")
                db.execute(
                    text(  # nosec B608
                        f"ALTER TABLE schemas.{table} "
                        f"ADD COLUMN IF NOT EXISTS {name} {sql_type}"
                    )
                )

            properties = ", ".join(
                f"'{k}' = '{v}'" for k, v in RETENTION_PROPERTIES.items()
            )
            logger.info(f"schemas.{table}: setting retention properties")
            db.execute(
                text(f"ALTER TABLE schemas.{table} SET TBLPROPERTIES ({properties})")  # nosec B608
            )

        db.commit()
        logger.info("Done.")


if __name__ == "__main__":
    main()
