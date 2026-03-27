from fastapi import APIRouter, Depends, Response, status
from loguru import logger
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from data_ingestion.cache import get_redis_connection
from data_ingestion.db.primary import get_db as get_db_primary
from data_ingestion.db.trino import get_db as get_db_trino

router = APIRouter(tags=["core"], include_in_schema=False)


@router.get("/api")
async def api_health_check():
    return {"status": "ok"}


@router.get("/api/live")
async def liveness_check(
    response: Response,
    primary: AsyncSession = Depends(get_db_primary),
    trino: Session = Depends(get_db_trino),
    redis: Redis = Depends(get_redis_connection),
):
    async def test_primary():
        try:
            return bool((await primary.execute(text("SELECT 1"))).first())
        except Exception as e:
            logger.error(e)
            return False

    def test_trino():
        try:
            return bool(trino.execute(text("SELECT 1")).first())
        except Exception as e:
            logger.error(e)
            return False

    body = {
        "api": "ok",
        "db": "ok" if test_primary() else "unhealthy",
        "trino": "ok" if test_trino() else "unhealthy",
        "redis": "ok" if await redis.ping() else "unhealthy",
    }

    response.status_code = (
        status.HTTP_200_OK
        if all(v == "ok" for v in body.values())
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return body
