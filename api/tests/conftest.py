from datetime import datetime, timedelta

import pytest
from data_ingestion.api import app
from data_ingestion.db.primary import session_maker
from data_ingestion.models.file_upload import FileUpload
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def db_session() -> AsyncSession:
    async with session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def seeded_file_uploads(db_session: AsyncSession) -> list[FileUpload]:
    uploads = [
        FileUpload(
            country="IND",
            file_name="file1.csv",
            created=datetime.utcnow() - timedelta(days=2),
        ),
        FileUpload(
            country="GHA",
            file_name="file2.csv",
            created=datetime.utcnow() - timedelta(days=1),
        ),
        FileUpload(
            country="USA",
            file_name="file3.csv",
            created=datetime.utcnow(),
        ),
    ]

    db_session.add_all(uploads)
    await db_session.commit()

    return uploads
