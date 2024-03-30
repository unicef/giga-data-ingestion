from data_ingestion.cache.cache import get_redis_context
from data_ingestion.settings import settings


async def set_cache_list(key: str, li: list[str]) -> None:
    """
    Stores a Python list as a Redis string. This assumes that the list elements are strings
    and each string contains no whitespace.

    :param key: The Redis key to store the list under.
    :param li: The list of strings to cache.
    :return: None
    """
    async with get_redis_context() as r:
        await r.set(
            key,
            str.join(" ", li),
            ex=settings.REDIS_CACHE_DEFAULT_TTL_SECONDS,
        )


async def get_cache_list(key: str) -> list[str] | None:
    """
    Retrieves a Python list from a Redis string. This assumes that the list elements are strings
    and each string contains no whitespace.

    :param key: The Redis key to retrieve the list from.
    :return: The list of strings.
    """
    async with get_redis_context() as r:
        string: bytes | None = await r.get(key)
        if string is None:
            return None
        return string.decode().split(" ")


async def set_cache_string(key: str, value: str | bytes) -> None:
    async with get_redis_context() as r:
        await r.set(key, value, ex=settings.REDIS_CACHE_DEFAULT_TTL_SECONDS)


async def get_cache_string(key: str) -> str | None:
    async with get_redis_context() as r:
        string: bytes | None = await r.get(key)
        if string is None:
            return None
        return string.decode()
