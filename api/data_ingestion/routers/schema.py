from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy import text
from sqlalchemy.orm import Session

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
    if name not in [
        "qos",
        "school_master",
        "school_reference",
        "school_geolocation",
        "school_coverage",
    ]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    # TODO: Determine how to dynamically pass table names with ORM
    res = db.execute(
        text(
            f"SELECT * FROM schemas.{name} ORDER BY primary_key, is_nullable NULLS LAST"  # nosec: `name`s are limited to the list above
        )
    )
    return res.mappings().all()
