from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from data_ingestion.constants import constants
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.schemas.schema import Schema as MetaSchema

router = APIRouter(
    prefix="/api/schema",
    tags=["schema"],
    dependencies=[Security(azure_scheme)],
)


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
    return [m for m in res.mappings().all() if m["name"] != "school_id_giga"]
