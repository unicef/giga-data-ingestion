import datetime
from unittest.mock import AsyncMock, patch

from data_ingestion.api import app
from data_ingestion.db.primary import get_db
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.models.file_upload import DQStatusEnum
from data_ingestion.schemas.upload import FileUpload as FileUploadSchema
from fastapi.testclient import TestClient
from fastapi_azure_auth.user import User

client = TestClient(app)


async def mock_azure_scheme():
    return User(
        aud="test",
        iss="test",
        sub="test",
        oid="test",
        name="Test User",
        claims={"emails": ["test@giga.org"], "roles": ["Brazil-School Geolocation"]},
        tid="test",
        ver="1.0",
        iat=1234567890,
        nbf=1234567890,
        exp=2234567890,
        access_token="test_token",
    )


async def mock_get_db():
    yield AsyncMock()


def test_upload_review_respects_dq_mode():
    app.dependency_overrides[azure_scheme] = mock_azure_scheme
    app.dependency_overrides[get_db] = mock_get_db

    with patch(
        "data_ingestion.routers.upload.upload_file", new_callable=AsyncMock
    ) as mock_upload:
        # Prepare a dummy return FileUploadSchema
        mock_upload.return_value = FileUploadSchema(
            id="test_id",
            created=datetime.datetime.now(datetime.UTC),
            uploader_id="12345678-1234-4234-8234-1234567890ab",
            uploader_email="test@giga.org",
            dq_report_path=None,
            dq_full_path=None,
            dq_status=DQStatusEnum.IN_PROGRESS,
            bronze_path=None,
            is_processed_in_staging=False,
            country="BRA",
            dataset="geolocation",
            source=None,
            original_filename="test.csv",
            column_to_schema_mapping={"School Name": "school_name"},
            column_license={"school_name": "CC-BY"},
            upload_path="raw/uploads/school-geolocation/BRA/test_id.csv",
        )

        form_data = {
            "country": "Brazil",
            "metadata": '{"mode": "CREATE"}',
            "column_to_schema_mapping": '{"School Name": "school_name"}',
            "column_license": '{"school_name": "CC"}',
            "dataset": "geolocation",
            "dq_mode": "master",  # The UI dropdown can pass either master or uploaded
        }

        files = {"file": ("test.csv", b"test content", "text/csv")}

        response = client.post(
            "/api/upload/review?dataset=geolocation", data=form_data, files=files
        )

        assert response.status_code == 200

        # Verify that upload_file was called
        mock_upload.assert_called_once()
        args, kwargs = mock_upload.call_args

        # The form is the 3rd positional argument
        form_arg = args[2] if len(args) > 2 else kwargs.get("form")

        assert form_arg is not None
        assert form_arg.dq_mode == "master"

    app.dependency_overrides.clear()
