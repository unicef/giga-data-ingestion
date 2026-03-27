"""Tests for the error_table router endpoints.

These tests verify the /api/error-table endpoints by mocking:
- Azure auth (azure_scheme) — bypassed to simulate authenticated user
- Trino DB session (get_db) — mocked to return controlled query results
"""

from datetime import datetime
from unittest.mock import MagicMock

from data_ingestion.api import app
from data_ingestion.db.trino import get_db
from data_ingestion.internal.auth import azure_scheme
from fastapi import status
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _mock_azure_scheme():
    """Bypass Azure B2C auth for testing."""
    return MagicMock(claims={"emails": ["test@example.com"]})


def _make_mock_trino(rows=None, mappings=None, scalar_value=0):
    effective_rows = mappings if mappings is not None else (rows or [])

    mock_session = MagicMock()

    def side_effect(query, *args, **kwargs):
        mock_result = MagicMock()
        query_str = str(query).lower()
        if "information_schema" in query_str:
            mock_result.mappings.return_value.all.return_value = [
                {"table_name": "upload_errors_bra"},
                {"table_name": "upload_errors_ken"},
            ]
        else:
            mock_result.mappings.return_value.all.return_value = effective_rows
            mock_result.scalar.return_value = scalar_value
            mock_result.first.return_value = (
                effective_rows[0] if effective_rows else None
            )
        return mock_result

    mock_session.execute.side_effect = side_effect
    return mock_session


SAMPLE_ROWS = [
    {
        "giga_sync_file_id": "file-001",
        "giga_sync_file_name": "upload_001.csv",
        "dataset_type": "geolocation",
        "country_code": "BRA",
        "row_data": '{"school_name": "Test School"}',
        "error_details": '{"dq_is_valid_lat": 0}',
        "created_at": datetime(2026, 3, 1, 12, 0, 0),
    },
    {
        "giga_sync_file_id": "file-002",
        "giga_sync_file_name": "upload_002.csv",
        "dataset_type": "coverage",
        "country_code": "KEN",
        "row_data": '{"school_name": "Another School"}',
        "error_details": '{"dq_is_valid_lon": 0}',
        "created_at": datetime(2026, 3, 2, 14, 0, 0),
    },
]

SUMMARY_ROWS = [
    {
        "country_code": "BRA",
        "dataset_type": "geolocation",
        "error_count": 15,
        "distinct_files": 3,
    },
    {
        "country_code": "KEN",
        "dataset_type": "coverage",
        "error_count": 7,
        "distinct_files": 2,
    },
]


# ---------------------------------------------------------------------------
# Test: unauthenticated access
# ---------------------------------------------------------------------------


class TestErrorTableUnauthenticated:
    """Endpoints should return 401 when called without auth."""

    client = TestClient(app)

    def test_list_errors_unauthenticated(self):
        resp = self.client.get("/api/error-table")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_summary_unauthenticated(self):
        resp = self.client.get("/api/error-table/summary")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_download_unauthenticated(self):
        resp = self.client.get("/api/error-table/download")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Test: list endpoint
# ---------------------------------------------------------------------------


class TestListUploadErrors:
    """Tests for GET /api/error-table."""

    def _get_client(self, mock_trino):
        app.dependency_overrides[azure_scheme] = _mock_azure_scheme
        app.dependency_overrides[get_db] = lambda: mock_trino
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_list_errors_returns_data(self):
        mock_trino = _make_mock_trino(mappings=SAMPLE_ROWS, scalar_value=2)
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table")
            assert resp.status_code == status.HTTP_200_OK
            body = resp.json()
            assert body["total_count"] == 2
            assert body["page"] == 1
            assert body["page_size"] == 10
            assert len(body["data"]) == 2
            assert body["data"][0]["giga_sync_file_id"] == "file-001"
            assert body["data"][0]["country_code"] == "BRA"

    def test_list_errors_with_country_filter(self):
        filtered = [SAMPLE_ROWS[0]]
        mock_trino = _make_mock_trino(mappings=filtered, scalar_value=1)
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table?country_code=BRA")
            assert resp.status_code == status.HTTP_200_OK
            body = resp.json()
            assert body["total_count"] == 1

    def test_list_errors_empty_table(self):
        mock_trino = _make_mock_trino(mappings=[], scalar_value=0)
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table")
            assert resp.status_code == status.HTTP_200_OK
            body = resp.json()
            assert body["total_count"] == 0
            assert body["data"] == []

    def test_list_errors_pagination(self):
        mock_trino = _make_mock_trino(mappings=SAMPLE_ROWS[:1], scalar_value=2)
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table?page=1&page_size=1")
            assert resp.status_code == status.HTTP_200_OK
            body = resp.json()
            assert body["page"] == 1
            assert body["page_size"] == 1

    def test_list_errors_table_not_exists(self):
        mock_trino = MagicMock()
        mock_trino.execute.side_effect = Exception("Table does not exist")
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table")
            assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Test: summary endpoint
# ---------------------------------------------------------------------------


class TestUploadErrorsSummary:
    """Tests for GET /api/error-table/summary."""

    def _get_client(self, mock_trino):
        app.dependency_overrides[azure_scheme] = _mock_azure_scheme
        app.dependency_overrides[get_db] = lambda: mock_trino
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_summary_returns_data(self):
        mock_trino = _make_mock_trino(mappings=SUMMARY_ROWS)
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table/summary")
            assert resp.status_code == status.HTTP_200_OK
            body = resp.json()
            assert len(body["data"]) == 2
            assert body["data"][0]["country_code"] == "BRA"
            assert body["data"][0]["error_count"] == 15
            assert body["data"][0]["distinct_files"] == 3

    def test_summary_table_not_exists(self):
        mock_trino = MagicMock()
        mock_trino.execute.side_effect = Exception("Table does not exist")
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table/summary")
            assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Test: download endpoint
# ---------------------------------------------------------------------------


class TestDownloadUploadErrors:
    """Tests for GET /api/error-table/download."""

    def _get_client(self, mock_trino):
        app.dependency_overrides[azure_scheme] = _mock_azure_scheme
        app.dependency_overrides[get_db] = lambda: mock_trino
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_download_returns_csv(self):
        mock_trino = _make_mock_trino(mappings=SAMPLE_ROWS)
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table/download")
            assert resp.status_code == status.HTTP_200_OK
            assert "text/csv" in resp.headers["content-type"]
            assert "attachment" in resp.headers["content-disposition"]
            assert "upload_errors.csv" in resp.headers["content-disposition"]
            # CSV body should contain the file IDs
            assert "file-001" in resp.text
            assert "file-002" in resp.text

    def test_download_with_country_filter_filename(self):
        mock_trino = _make_mock_trino(mappings=[SAMPLE_ROWS[0]])
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table/download?country_code=BRA")
            assert resp.status_code == status.HTTP_200_OK
            assert "upload_errors_BRA.csv" in resp.headers["content-disposition"]

    def test_download_with_all_filters_filename(self):
        mock_trino = _make_mock_trino(mappings=[SAMPLE_ROWS[0]])
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get(
                "/api/error-table/download?country_code=BRA&dataset_type=geolocation"
            )
            assert resp.status_code == status.HTTP_200_OK
            assert (
                "upload_errors_BRA_geolocation.csv"
                in resp.headers["content-disposition"]
            )

    def test_download_empty_result_404(self):
        mock_trino = _make_mock_trino(mappings=[])
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table/download?country_code=UNKNOWN")
            assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_download_table_not_exists(self):
        mock_trino = MagicMock()
        mock_trino.execute.side_effect = Exception("Table does not exist")
        client = self._get_client(mock_trino)
        for c in client:
            resp = c.get("/api/error-table/download")
            assert resp.status_code == status.HTTP_404_NOT_FOUND
