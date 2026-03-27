from contextlib import (
    AbstractAsyncContextManager,
    AbstractContextManager,
    asynccontextmanager,
    contextmanager,
)

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from data_ingestion.settings import settings

engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=not settings.IN_PRODUCTION,
    future=True,
)

sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=not settings.IN_PRODUCTION,
    future=True,
)

session_maker = async_sessionmaker(
    bind=engine,
    autoflush=True,
    autocommit=False,
    expire_on_commit=False,
)

sync_session_maker = sessionmaker(
    bind=sync_engine,
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


def sync_get_db():
    session = sync_session_maker()
    try:
        yield session
    except DatabaseError as err:
        logger.error(str(err))
        raise err
    finally:
        session.close()


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


@contextmanager
def sync_get_db_context() -> AbstractContextManager[Session]:
    session = sync_session_maker()
    try:
        yield session
    except DatabaseError as err:
        logger.error(str(err))
        raise err
    finally:
        session.close()
