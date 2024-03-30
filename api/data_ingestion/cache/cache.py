from contextlib import AbstractAsyncContextManager, asynccontextmanager

import redis.asyncio as redis
from loguru import logger

from data_ingestion.settings import settings

pool = redis.ConnectionPool.from_url(settings.REDIS_URL)


async def get_redis_connection():
    r = redis.Redis.from_pool(pool)
    try:
        yield r
    except Exception as exc:
        logger.error(exc)
    finally:
        await r.aclose()


@asynccontextmanager
async def get_redis_context() -> AbstractAsyncContextManager[redis.Redis]:
    r = redis.Redis.from_pool(pool)
    try:
        yield r
    except Exception as exc:
        logger.error(exc)
    finally:
        await r.aclose()
