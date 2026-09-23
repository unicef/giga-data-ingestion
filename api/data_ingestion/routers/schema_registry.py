from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Security,
    UploadFile,
    status,
)
from fastapi_azure_auth.user import User as AzureUser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from data_ingestion.db.primary import get_db
from data_ingestion.db.trino import get_db as get_trino_db
from data_ingestion.internal import schema_registry as registry
from data_ingestion.internal.auth import azure_scheme
from data_ingestion.models import User as DatabaseUser
from data_ingestion.permissions.permissions import IsPrivileged
from data_ingestion.schemas.schema_registry import (
    AuditLogResponse,
    DatasetGroupCreate,
    DatasetGroupResponse,
    DatasetImportResponse,
    DatasetLinkCreate,
    DatasetLinkResponse,
    DatasetVersion,
    MoveDatasetRequest,
    ProposalCreate,
    ProposalDetail,
    ProposalResponse,
    RegistryColumn,
    RejectProposalRequest,
    SchemaDatasetCreate,
    SchemaDatasetResponse,
)

router = APIRouter(
    prefix="/api/schema-registry",
    tags=["schema-registry"],
    dependencies=[Security(azure_scheme)],
)


async def get_current_database_user(
    user: AzureUser = Depends(azure_scheme),
    db: AsyncSession = Depends(get_db),
) -> DatabaseUser:
    email = (user.claims.get("emails") or [None])[0]
    database_user = await db.scalar(
        select(DatabaseUser).where(DatabaseUser.email == email)
    )
    if database_user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    return database_user


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------


@router.get("/groups", response_model=list[DatasetGroupResponse])
async def list_groups(db: AsyncSession = Depends(get_db)):
    return await registry.list_groups(db)


@router.post(
    "/groups",
    status_code=status.HTTP_201_CREATED,
    response_model=DatasetGroupResponse,
    dependencies=[Security(IsPrivileged())],
)
async def create_group(body: DatasetGroupCreate, db: AsyncSession = Depends(get_db)):
    return await registry.create_group(
        db, key=body.key, name=body.name, description=body.description
    )


# ---------------------------------------------------------------------------
# Datasets & links
# ---------------------------------------------------------------------------


@router.get("/datasets", response_model=list[SchemaDatasetResponse])
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    return await registry.list_datasets(db, trino_db)


@router.post(
    "/datasets",
    status_code=status.HTTP_201_CREATED,
    response_model=SchemaDatasetResponse,
    dependencies=[Security(IsPrivileged())],
)
async def create_dataset(body: SchemaDatasetCreate, db: AsyncSession = Depends(get_db)):
    return await registry.create_dataset(db, key=body.key, group_id=body.group_id)


@router.get("/datasets/{key}", response_model=SchemaDatasetResponse)
async def get_dataset(
    key: str,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    return await registry.get_dataset_detail(db, trino_db, key)


@router.post(
    "/datasets/{key}/import",
    response_model=DatasetImportResponse,
    dependencies=[Security(IsPrivileged())],
)
async def import_dataset_columns(
    key: str,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    csv_bytes = await file.read()
    return await registry.import_columns_from_csv(
        db, trino_db, dataset_key=key, csv_bytes=csv_bytes
    )


@router.patch(
    "/datasets/{key}/move",
    response_model=SchemaDatasetResponse,
    dependencies=[Security(IsPrivileged())],
)
async def move_dataset(
    key: str, body: MoveDatasetRequest, db: AsyncSession = Depends(get_db)
):
    return await registry.move_dataset(db, key, body.group_id)


@router.get("/datasets/{key}/links", response_model=list[DatasetLinkResponse])
async def list_links(key: str, db: AsyncSession = Depends(get_db)):
    return await registry.list_links(db, key)


@router.post(
    "/datasets/{key}/links",
    status_code=status.HTTP_201_CREATED,
    response_model=DatasetLinkResponse,
    dependencies=[Security(IsPrivileged())],
)
async def create_link(
    key: str, body: DatasetLinkCreate, db: AsyncSession = Depends(get_db)
):
    return await registry.create_link(db, key, body.linked_dataset_key)


@router.delete(
    "/datasets/{key}/links/{linked_key}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Security(IsPrivileged())],
)
async def delete_link(key: str, linked_key: str, db: AsyncSession = Depends(get_db)):
    await registry.delete_link(db, key, linked_key)


# ---------------------------------------------------------------------------
# Columns (read straight from Delta via Trino)
# ---------------------------------------------------------------------------


@router.get("/datasets/{key}/columns", response_model=list[RegistryColumn])
async def list_columns(
    key: str,
    as_of_version: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    await registry.get_dataset_by_key(db, key)
    return registry.get_registry_columns(key, trino_db, as_of_version=as_of_version)


@router.get("/datasets/{key}/columns/{name}", response_model=RegistryColumn)
async def get_column(
    key: str,
    name: str,
    as_of_version: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    await registry.get_dataset_by_key(db, key)
    column = registry.get_registry_column(
        key, name, trino_db, as_of_version=as_of_version
    )
    if column is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Column not found")
    return column


@router.get(
    "/datasets/{key}/columns/{name}/history", response_model=list[ProposalResponse]
)
async def get_column_history(key: str, name: str, db: AsyncSession = Depends(get_db)):
    return await registry.get_column_history(db, key, name)


# ---------------------------------------------------------------------------
# Versions (Delta transaction log via Trino)
# ---------------------------------------------------------------------------


@router.get("/datasets/{key}/versions", response_model=list[DatasetVersion])
async def list_versions(
    key: str,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    dataset = await registry.get_dataset_by_key(db, key)
    return await registry.list_dataset_versions_with_proposals(db, trino_db, dataset)


@router.get("/datasets/{key}/versions/{version}", response_model=list[RegistryColumn])
async def get_version_snapshot(
    key: str,
    version: int,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    await registry.get_dataset_by_key(db, key)
    return registry.get_registry_columns(key, trino_db, as_of_version=version)


@router.get(
    "/datasets/{key}/versions/{version}/diff/{other_version}",
    response_model=list[dict],
)
async def diff_versions(
    key: str,
    version: int,
    other_version: int,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
):
    await registry.get_dataset_by_key(db, key)
    before_columns = {
        c.name: c
        for c in registry.get_registry_columns(key, trino_db, as_of_version=version)
    }
    after_columns = {
        c.name: c
        for c in registry.get_registry_columns(
            key, trino_db, as_of_version=other_version
        )
    }
    names = sorted(set(before_columns) | set(after_columns))
    return [
        {
            "column_name": name,
            "diff": [
                d.model_dump()
                for d in registry.diff_columns(
                    before_columns.get(name), after_columns.get(name)
                )
            ],
        }
        for name in names
        if before_columns.get(name) != after_columns.get(name)
    ]


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------


@router.post(
    "/datasets/{key}/proposals",
    status_code=status.HTTP_201_CREATED,
    response_model=ProposalResponse,
)
async def create_proposal(
    key: str,
    body: ProposalCreate,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
    current_user: DatabaseUser = Depends(get_current_database_user),
):
    return await registry.create_proposal(
        db,
        trino_db,
        dataset_key=key,
        column_name=body.column_name,
        proposal_type=body.proposal_type,
        after_state=body.after_state,
        proposed_by_id=current_user.id,
        proposed_by_email=current_user.email,
    )


@router.get("/proposals", response_model=list[ProposalResponse])
async def list_proposals(
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    dataset_key: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await registry.list_proposals(
        db, status_filter=status_filter, dataset_key=dataset_key
    )


@router.get("/proposals/{id}", response_model=ProposalDetail)
async def get_proposal(id: str, db: AsyncSession = Depends(get_db)):
    proposal = await registry.get_proposal(db, id)
    diff = await registry.get_proposal_diff(proposal)
    return ProposalDetail(
        **ProposalResponse.model_validate(proposal).model_dump(), diff=diff
    )


@router.post(
    "/proposals/{id}/approve",
    response_model=ProposalResponse,
    dependencies=[Security(IsPrivileged())],
)
async def approve_proposal(
    id: str,
    db: AsyncSession = Depends(get_db),
    trino_db: Session = Depends(get_trino_db),
    current_user: DatabaseUser = Depends(get_current_database_user),
):
    return await registry.approve_proposal(
        db,
        trino_db,
        id,
        actor_id=current_user.id,
        actor_email=current_user.email,
    )


@router.post(
    "/proposals/{id}/reject",
    response_model=ProposalResponse,
    dependencies=[Security(IsPrivileged())],
)
async def reject_proposal(
    id: str,
    body: RejectProposalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: DatabaseUser = Depends(get_current_database_user),
):
    return await registry.reject_proposal(
        db,
        id,
        actor_id=current_user.id,
        actor_email=current_user.email,
        reason=body.reason,
    )


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------


@router.get(
    "/audit",
    response_model=list[AuditLogResponse],
    dependencies=[Security(IsPrivileged())],
)
async def list_audit_log(
    dataset_key: str | None = None,
    column_name: str | None = None,
    actor_id: str | None = None,
    action: str | None = None,
    limit: int = Query(default=50, le=200, gt=0),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await registry.list_audit_log(
        db,
        dataset_key=dataset_key,
        column_name=column_name,
        actor_id=actor_id,
        action=action,
        limit=limit,
        offset=offset,
    )
