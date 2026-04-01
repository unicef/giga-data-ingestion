import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_uploads_by_country_returns_ordered_results(
    async_client: AsyncClient,
    seeded_file_uploads,
):
    """
    GIVEN: multiple uploads for a country
    WHEN: endpoint is called
    THEN: results should be ordered by created desc
    """

    response = await async_client.get(
        "/api/upload/by-country",
        params={"country": "GHA"},
    )

    assert response.status_code == 200

    data = response.json()
    assert len(data) >= 1

    timestamps = [row["created"] for row in data]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.asyncio
async def test_get_upload_details_returns_multiple_rows(
    async_client,
    seeded_file_uploads,
):
    """
    GIVEN: multiple upload ids
    WHEN: details endpoint is called
    THEN: matching uploads should be returned
    """

    upload_ids = [row.id for row in seeded_file_uploads[:2]]

    response = await async_client.post(
        "/api/upload/details",
        json={"upload_ids": upload_ids},
    )

    assert response.status_code == 200

    data = response.json()
    assert len(data) == len(upload_ids)

    returned_ids = [row["upload_id"] for row in data]
    assert set(returned_ids) == set(upload_ids)
