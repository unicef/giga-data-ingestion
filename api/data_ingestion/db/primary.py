from contextlib import AbstractAsyncContextManager, asynccontextmanager

from loguru import logger
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from data_ingestion.settings import settings

engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=not settings.IN_PRODUCTION,
    future=True,
)

session_maker = async_sessionmaker(
    bind=engine,
    autoflush=True,
    autocommit=False,
    expire_on_commit=False,
)


async def get_db():
    session = session_maker()
    try:
        yield session
    except DatabaseError as err:
        logger.error(str(err))
        raise err
    finally:
        await session.close()


@asynccontextmanager
async def get_db_context() -> AbstractAsyncContextManager[AsyncSession]:
    session = session_maker()
    try:
        yield session
    except DatabaseError as err:
        logger.error(str(err))
        raise err
    finally:
        await session.close()
