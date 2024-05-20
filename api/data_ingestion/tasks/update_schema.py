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

            for mapping in res.mappings().all():
                metaschema = Schema(**mapping)
                if metaschema.primary_key:
                    metaschema.is_nullable = True

                if metaschema.is_important is None:
                    metaschema.is_important = False

                schema.append(metaschema)

            schema = sorted(
                schema, key=lambda s: (s.is_nullable, -s.is_important, s.name)
            )
            schemas[name] = schema

        if "school_geolocation" in schemas.keys():
            schemas["school_geolocation_qos"] = [*schemas["school_geolocation"]]
            for col in schemas["school_geolocation_qos"]:
                if col.name in [
                    "education_level_govt",
                    "school_id_govt_type",
                ]:
                    col.is_nullable = True
                    col.is_important = True

    for name, schema in schemas.items():
        async_to_sync(set_cache_string)(
            get_schema_key(name),
            orjson.dumps([s.model_dump(mode="json") for s in schema]),
        )

    return schemas
