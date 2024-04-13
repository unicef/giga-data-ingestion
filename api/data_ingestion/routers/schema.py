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
        .order_by(
            column("primary_key"),
            column("is_nullable").nulls_last(),
            column("name"),
        )
    )

    schema = []
    for mapping in res.mappings().all():
        metaschema = MetaSchema(**mapping)
        if metaschema.primary_key:
            metaschema.is_nullable = True
            schema.append(metaschema)
            continue

        if not metaschema.is_system_generated:
            schema.append(metaschema)

    background_tasks.add_task(
        set_cache_string, get_schema_key(name), orjson.dumps(jsonable_encoder(schema))
    )
    return schema
