from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security, status
from sqlalchemy import column, literal, select, text
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import SCHEMAS_KEY
from data_ingestion.cache.serde import get_cache_list, set_cache_list
from data_ingestion.constants import constants
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.schemas.schema import Schema as MetaSchema

router = APIRouter(
    prefix="/api/schema",
    tags=["schema"],
    dependencies=[Security(azure_scheme)],
)


@router.get("", response_model=list[str])
async def list_schemas(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
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


@router.get("/{name}", response_model=list[MetaSchema])
async def get_schema(name: str, db: Session = Depends(get_db)):
    if name not in constants.ALLOWED_SCHEMA_NAMES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    # TODO: Determine how to dynamically pass table names with ORM
    res = db.execute(
        text(
            f"SELECT * FROM schemas.{name} ORDER BY primary_key, is_nullable NULLS LAST, name"  # nosec: `name`s are limited to the list above
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

    return schema
