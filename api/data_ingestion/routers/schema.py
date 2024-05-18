import io

import orjson
import pandas as pd
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Response,
    Security,
    status,
)
from sqlalchemy.orm import Session

from data_ingestion.cache.keys import get_schema_key
from data_ingestion.cache.serde import get_cache_string
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.internal.schema import (
    get_schema as _get_schema,
    get_schemas,
)
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

    return await _get_schema(name, db, background_tasks)


@router.get("/{name}/download", response_class=Response)
async def download_schema(
    response: Response,
    name: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    schemas = await get_schemas(db, background_tasks)
    if name not in schemas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if (schema := await get_cache_string(get_schema_key(name))) is not None:
        schema = orjson.loads(schema)
    else:
        schema = [s.model_dump() for s in await _get_schema(name, db, background_tasks)]

    df = pd.DataFrame.from_records(schema)

    buffer = io.BytesIO()
    df[["name", "data_type", "is_nullable", "description"]].to_csv(buffer, index=False)
    buffer.seek(0)

    response.media_type = "text/csv"
    response.headers.update({"Content-Disposition": f"attachment; filename={name}.csv"})
    return buffer.getvalue()
