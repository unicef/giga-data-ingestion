import json
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, Request, Response, status
from loguru import logger
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from data_ingestion.cache import get_redis_connection
from data_ingestion.db.primary import get_db as get_db_primary
from data_ingestion.db.trino import get_db as get_db_trino
from data_ingestion.settings import settings

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


@router.post("/tunnel")
async def sentry_tunnel(request: Request):
    if not settings.SENTRY_TUNNEL_HOST:
        return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    body = await request.body()
    try:
        envelope_header = json.loads(body.split(b"\n", 1)[0])
        dsn = envelope_header.get("dsn", "")
        parsed = urlparse(dsn)
        if parsed.hostname != settings.SENTRY_TUNNEL_HOST:
            return Response(status_code=status.HTTP_400_BAD_REQUEST)
        project_id = parsed.path.strip("/")
        url = f"{parsed.scheme}://{parsed.hostname}/api/{project_id}/envelope/"
    except Exception:
        return Response(status_code=status.HTTP_400_BAD_REQUEST)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            content=body,
            headers={"Content-Type": "application/x-sentry-envelope"},
        )
    return Response(status_code=resp.status_code)
