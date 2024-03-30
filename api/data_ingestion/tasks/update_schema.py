import orjson
from asgiref.sync import async_to_sync
from sqlalchemy import column, literal, select, text

from data_ingestion.cache.keys import SCHEMAS_KEY, get_schema_key
from data_ingestion.cache.serde import get_cache_list, set_cache_list, set_cache_string
from data_ingestion.celery import celery
from data_ingestion.db.trino import get_db_context
from data_ingestion.schemas.schema import Schema


def get_schema_list() -> list[str]:
    with get_db_context() as db:
        res = db.execute(
            select("*")
            .select_from(text("information_schema.tables"))
            .where(column("table_schema") == literal("schemas"))
            .order_by(column("table_name"))
        )
        mappings = res.mappings().all()

    return [m["table_name"] for m in mappings]


@celery.task(name="data_ingestion.tasks.update_schemas_list")
def update_schemas_list():
    schemas = get_schema_list()
    async_to_sync(set_cache_list)(SCHEMAS_KEY, schemas)
    return SCHEMAS_KEY, schemas


@celery.task(name="data_ingestion.tasks.update_schemas")
def update_schemas():
    schema_names = async_to_sync(get_cache_list)(SCHEMAS_KEY)
    if schema_names is None:
        schema_names = get_schema_list()

    schemas = {}
    with get_db_context() as db:
        for name in schema_names:
            schema = []

            res = db.execute(
                select("*")
                .select_from(text(f"schemas.{name}"))
                .order_by(
                    column("primary_key"),
                    column("is_nullable").nulls_last(),
                    column("name"),
                )
            )

            for mapping in res.mappings().all():
                metaschema = Schema(**mapping)
                if metaschema.primary_key:
                    metaschema.is_nullable = True
                    schema.append(metaschema.model_dump(mode="json"))
                    continue

                if not metaschema.is_system_generated:
                    schema.append(metaschema.model_dump(mode="json"))

            schemas[name] = schema

    for name, schema in schemas.items():
        async_to_sync(set_cache_string)(
            get_schema_key(name),
            orjson.dumps(schema),
        )

    return schemas
