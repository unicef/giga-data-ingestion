from fastapi import BackgroundTasks
from fastapi.encoders import jsonable_encoder
from loguru import logger
from orjson import orjson
from sqlalchemy import column, literal, select, text
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import SCHEMAS_KEY, get_schema_key
from data_ingestion.cache.serde import get_cache_list, set_cache_list, set_cache_string
from data_ingestion.schemas.schema import Schema
from data_ingestion.utils.schema import sort_schema_columns_key


async def get_schemas(
    db: Session,
    background_tasks: BackgroundTasks,
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
    schemas = [m["table_name"] for m in mappings]

    background_tasks.add_task(set_cache_list, SCHEMAS_KEY, schemas)
    return schemas


def get_schema(  # noqa: C901
    name: str,
    db: Session,
    background_tasks: BackgroundTasks = None,
    *,
    is_update=False,
    is_qos=False,
) -> list[Schema]:
    if is_qos and name != "school_geolocation":
        raise ValueError(
            f"`is_qos` can only be used with school_geolocation schema\nschema_name={name}"
        )

    if is_update and is_qos:
        raise ValueError(
            "`is_update` and `is_qos` cannot be True at the same time"
        )  # qos is always create

    res = db.execute(
        select("*")
        .select_from(text(f"schemas.{name}"))
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
        metaschema = Schema(**mapping)
        logger.info(metaschema.model_dump())

        if metaschema.is_important is None:
            metaschema.is_important = False

        if metaschema.primary_key is None:
            metaschema.primary_key = False

        if is_qos and metaschema.name == "education_level_govt":
            metaschema.is_nullable = True

        if (
            name == "school_geolocation"
            and is_update
            and metaschema.name != "school_id_govt"
        ):
            metaschema.is_nullable = True

        schema.append(metaschema)

    schema = sorted(schema, key=sort_schema_columns_key)

    if is_update:
        schema_cache_key = f"{name}_update"
    elif is_qos:
        schema_cache_key = f"{name}_qos"
    else:
        schema_cache_key = name

    if background_tasks is not None:
        background_tasks.add_task(
            set_cache_string,
            get_schema_key(schema_cache_key),
            orjson.dumps(jsonable_encoder([s.model_dump() for s in schema])),
        )

    return schema
