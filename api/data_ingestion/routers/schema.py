import io
from typing import Annotated

import orjson
import pandas as pd
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Header,
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    cache_control: Annotated[str, Header()] = None,
):
    bypass_cache = cache_control == "no-cache"
    return await get_schemas(db, background_tasks, bypass_cache=bypass_cache)


@router.get("/{name}", response_model=list[MetaSchema])
async def get_schema(
    name: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    cache_control: Annotated[str, Header()] = None,
    is_update: bool = False,
    is_qos: bool = False,
):
    if is_qos and is_update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="is_qos cannot be used with is_update",
        )

    if is_qos and name != "school_geolocation":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="is_qos can only be used with school_geolocation schema",
        )

    bypass_cache = cache_control == "no-cache"

    schemas = await get_schemas(db, background_tasks)

    if name not in schemas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if is_qos:
        schema_cache_key = f"{name}_qos"
    elif is_update:
        schema_cache_key = f"{name}_update"
    else:
        schema_cache_key = name

    if not bypass_cache and (
        (schema := await get_cache_string(get_schema_key(schema_cache_key))) is not None
    ):
        return orjson.loads(schema)

    return _get_schema(name, db, background_tasks)


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

    # Remove system-generated cols
    df = df[df["is_system_generated"].isnull() | (df["is_system_generated"] is False)]

    # Select specific cols
    df = df[["name", "data_type", "is_nullable", "is_important", "description"]]

    # Invert `is_nullable` to change the meaning to `is_mandatory`
    df["is_nullable"] = ~df["is_nullable"]

    # Rename columns to be user-friendly
    df = df.rename(
        columns={
            "name": "Column Name",
            "data_type": "Data Type",
            "is_nullable": "Mandatory",
            "is_important": "Important",
            "description": "Description",
        }
    )

    df.to_csv(buffer, index=False)
    buffer.seek(0)

    response.media_type = "text/csv"
    response.headers.update({"Content-Disposition": f"attachment; filename={name}.csv"})
    return buffer.getvalue()
