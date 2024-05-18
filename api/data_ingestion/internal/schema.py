from fastapi import BackgroundTasks
from fastapi.encoders import jsonable_encoder
from orjson import orjson
from sqlalchemy import column, literal, select, text
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import SCHEMAS_KEY, get_schema_key
from data_ingestion.cache.serde import get_cache_list, set_cache_list, set_cache_string
from data_ingestion.schemas.schema import Schema


async def get_schemas(
    db: Session, background_tasks: BackgroundTasks
) -> list[str] | None:
    if (schemas := await get_cache_list(SCHEMAS_KEY)) is not None:
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


async def get_schema(
    name: str,
    db: Session,
    background_tasks: BackgroundTasks,
) -> list[Schema]:
    res = db.execute(
        select("*")
        .select_from(text(f"schemas.{name}"))
        .where(
            column("is_system_generated").is_(None)
            | (column("is_system_generated") == False)  # noqa: E712
            | column("primary_key")
        )
        .order_by(
            column("is_nullable").nulls_last(),
            column("is_important").nulls_last(),
            column("name"),
        )
    )

    schema = []
    for mapping in res.mappings().all():
        metaschema = Schema(**mapping)
        if metaschema.primary_key:
            metaschema.is_nullable = True

        if metaschema.is_important is None:
            metaschema.is_important = False

        schema.append(metaschema)

    schemas = sorted(schema, key=lambda s: (s.is_nullable, -s.is_important, s.name))

    background_tasks.add_task(
        set_cache_string,
        get_schema_key(name),
        orjson.dumps(jsonable_encoder(schema)),
    )
    return schemas
