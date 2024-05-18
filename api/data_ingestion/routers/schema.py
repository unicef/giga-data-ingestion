import orjson
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import column, select, text
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import get_schema_key
from data_ingestion.cache.serde import get_cache_string, set_cache_string
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.schema import get_schemas
from data_ingestion.schemas.schema import Schema as MetaSchema

router = APIRouter(
    prefix="/api/schema",
    tags=["schema"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[str])
async def list_schemas(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    return await get_schemas(db, background_tasks)


@router.get("/{name}", response_model=list[MetaSchema])
async def get_schema(
    name: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    schemas = await get_schemas(db, background_tasks)
    if name not in schemas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if (schema := await get_cache_string(get_schema_key(name))) is not None:
        return orjson.loads(schema)

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
        metaschema = MetaSchema(**mapping)
        if metaschema.primary_key:
            metaschema.is_nullable = True

        if metaschema.is_important is None:
            metaschema.is_important = False

        schema.append(metaschema)

    schema = sorted(schema, key=lambda s: (s.is_nullable, -s.is_important, s.name))

    background_tasks.add_task(
        set_cache_string, get_schema_key(name), orjson.dumps(jsonable_encoder(schema))
    )
    return schema
