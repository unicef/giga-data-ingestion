import pytest
from data_ingestion.models import ApprovalRequest


@pytest.mark.asyncio
async def test_get_approvals_by_upload_ids(
    async_client,
    seeded_file_uploads,
    db_session,
):
    """
    GIVEN: approval requests linked to uploads
    WHEN: filtering by upload_ids
    THEN: only matching approvals are returned
    """

    # Seed an approval request manually
    approval = ApprovalRequest(
        upload_id=seeded_file_uploads[0].id,
        country="IN",
        dataset="School List",
        enabled=True,
        is_merge_processing=False,
    )
    db_session.add(approval)
    await db_session.commit()

    response = await async_client.post(
        "/api/approval-requests/by-upload",
        json={"upload_ids": [seeded_file_uploads[0].id]},
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 1
    assert data[0]["upload_id"] == seeded_file_uploads[0].id
