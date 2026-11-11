import orjson
from asgiref.sync import async_to_sync
from fastapi.encoders import jsonable_encoder

from data_ingestion.cache.keys import SCHEMAS_KEY, get_schema_key
from data_ingestion.cache.serde import get_cache_list, set_cache_list, set_cache_string
from data_ingestion.celery import celery
from data_ingestion.db.primary import get_db_context
from data_ingestion.internal.schema import get_schema, get_schemas


async def _get_schema_list() -> list[str]:
    async with get_db_context() as db:
        return await get_schemas(db)


def get_schema_list() -> list[str]:
    return async_to_sync(_get_schema_list)()


@celery.task(name="data_ingestion.tasks.update_schemas_list")
def update_schemas_list():
    schemas = get_schema_list()
    async_to_sync(set_cache_list)(SCHEMAS_KEY, schemas)
    return SCHEMAS_KEY, schemas


@celery.task(name="data_ingestion.tasks.update_schemas")
def update_schemas():  # noqa: C901
    schema_names = async_to_sync(get_cache_list)(SCHEMAS_KEY)
    if schema_names is None:
        schema_names = get_schema_list()

    async def load_schemas():
        async with get_db_context() as db:
            return {name: await get_schema(name, db) for name in schema_names}

    schemas = async_to_sync(load_schemas)()

    for name, schema in schemas.items():
        async_to_sync(set_cache_string)(
            get_schema_key(name),
            orjson.dumps(jsonable_encoder(schema)),
        )

    return jsonable_encoder(schemas)
