from data_ingestion.api import app
from fastapi import status
from fastapi.testclient import TestClient

client = TestClient(app)


def test_unauthenticated_request():
    response = client.get("/api/users")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
