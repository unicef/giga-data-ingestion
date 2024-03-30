from fastapi import BackgroundTasks
from sqlalchemy import column, literal, select, text
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import SCHEMAS_KEY
from data_ingestion.cache.serde import get_cache_list, set_cache_list


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
