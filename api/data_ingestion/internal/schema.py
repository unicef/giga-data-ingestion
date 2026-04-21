import uuid

from fastapi import BackgroundTasks
from fastapi.encoders import jsonable_encoder
from loguru import logger
from orjson import orjson
from sqlalchemy import column, literal, select, text
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import SCHEMAS_KEY, get_schema_key
from data_ingestion.cache.serde import get_cache_list, set_cache_list, set_cache_string
from data_ingestion.schemas.schema_column import SchemaColumn
from data_ingestion.utils.schema import sort_schema_columns_key


async def get_schemas(
    db: Session,
    background_tasks: BackgroundTasks = None,
    *,
    bypass_cache: bool = False,
) -> list[str] | None:
    if not bypass_cache and (
        (schemas := await get_cache_list(SCHEMAS_KEY)) is not None
    ):
        return schemas

    res = db.execute(
        select("*")
        .select_from(text("information_schema.tables"))
        .where(column("table_schema") == literal("schemas"))
        .order_by(column("table_name"))
    )
    mappings = res.mappings().all()
    schemas = [
        *(
            "school_geolocation"
            if m["table_name"] == "school_geolocation_metadata"
            else m["table_name"]
            for m in mappings
        ),
        "school_geolocation_qos",
        "school_geolocation_update",
    ]

    if background_tasks is not None:
        background_tasks.add_task(set_cache_list, SCHEMAS_KEY, schemas)

    return schemas


def _should_skip_column(name: str, column_name: str) -> bool:
    """Determine if a column should be skipped based on table context or system rules."""
    if "geolocation" in name and column_name == "school_id_giga":
        return True

    # System generated columns filter
    if column_name in [
        "giga_sync_id",
        "country",
        "country_code",
        "created_at",
        "file_size_bytes",
        "giga_sync_uploaded_at",
        "raw_file_path",
        "schema_name",
    ]:
        return True
    return False


def _apply_schema_overrides(name: str, col: SchemaColumn):
    """Apply business-specific metadata overrides to a schema column."""
    # Important fields tagging
    if col.name in [
        "school_id_govt",
        "school_name",
        "education_level_govt",
        "latitude",
        "longitude",
    ]:
        col.is_important = True
    elif col.is_important is None:
        col.is_important = False

    if col.primary_key is None:
        col.primary_key = False

    # Nullability overrides for specific operational views
    if name == "school_geolocation_qos" and col.name == "education_level_govt":
        col.is_nullable = True

    if name == "school_geolocation_update" and col.name != "school_id_govt":
        col.is_nullable = True


def _inject_missing_core_fields(name: str, schema: list[SchemaColumn]):
    """Ensure core geolocation metadata fields exist in the schema."""
    if not name.startswith("school_geolocation"):
        return

    existing_names = {s.name for s in schema}
    core_fields = [
        (
            "school_id_govt",
            "varchar",
            False,
            True,
            True,
            "Government unique identifier",
        ),
        ("school_name", "varchar", False, True, False, "Official school name"),
        ("education_level_govt", "varchar", False, True, False, "Education level"),
        ("latitude", "double", False, True, False, "Latitude"),
        ("longitude", "double", False, True, False, "Longitude"),
    ]
    for name_f, dtype, nullable, important, pk, desc in core_fields:
        if name_f not in existing_names:
            schema.append(
                SchemaColumn(
                    id=str(uuid.uuid4()),
                    name=name_f,
                    data_type=dtype,
                    is_nullable=nullable,
                    is_important=important,
                    is_system_generated=False,
                    primary_key=pk,
                    description=desc,
                    license="ODBL",
                    partition_order=None,
                    units=None,
                    hint=None,
                )
            )


def get_schema(
    name: str,
    db: Session,
    background_tasks: BackgroundTasks = None,
) -> list[SchemaColumn]:
    table_name = name

    if name.startswith("school_geolocation"):
        table_name = "school_geolocation_metadata"

    res = db.execute(
        select("*")
        .select_from(text(f"schemas.{table_name}"))
        .where(
            column("is_system_generated").is_(None)
            | (column("is_system_generated") == False)  # noqa: E712
            | (column("primary_key") == True)  # noqa: E712
        )
        .order_by(
            column("primary_key").desc().nulls_last(),
            column("is_nullable").nulls_last(),
            column("is_important").nulls_last(),
            column("name"),
        )
    )

    schema = []
    for mapping in res.mappings().all():
        schema_column = SchemaColumn(**mapping)
        logger.info(schema_column.model_dump())

        if _should_skip_column(name, schema_column.name):
            continue

        _apply_schema_overrides(name, schema_column)
        schema.append(schema_column)

    _inject_missing_core_fields(name, schema)

    schema = sorted(schema, key=sort_schema_columns_key)

    if background_tasks is not None:
        background_tasks.add_task(
            set_cache_string,
            get_schema_key(name),
            orjson.dumps(jsonable_encoder([s.model_dump() for s in schema])),
        )

    return schema
