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
        *[m["table_name"] for m in mappings],
        "school_geolocation_qos",
        "school_geolocation_update",
    ]

    if background_tasks is not None:
        background_tasks.add_task(set_cache_list, SCHEMAS_KEY, schemas)

    return schemas


def get_schema(
    name: str,
    db: Session,
    background_tasks: BackgroundTasks = None,
) -> list[SchemaColumn]:
    table_name = name

    if name.startswith("school_geolocation"):
        table_name = "school_geolocation"

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

        if "geolocation" in name and schema_column.name == "school_id_giga":
            continue

        if schema_column.is_important is None:
            schema_column.is_important = False

        if schema_column.primary_key is None:
            schema_column.primary_key = False

        if (
            name == "school_geolocation_qos"
            and schema_column.name == "education_level_govt"
        ):
            schema_column.is_nullable = True

        if (
            name == "school_geolocation_update"
            and schema_column.name != "school_id_govt"
        ):
            schema_column.is_nullable = True

        schema.append(schema_column)

    schema = sorted(schema, key=sort_schema_columns_key)

    if background_tasks is not None:
        background_tasks.add_task(
            set_cache_string,
            get_schema_key(name),
            orjson.dumps(jsonable_encoder([s.model_dump() for s in schema])),
        )

    return schema
