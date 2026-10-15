import csv
import io
import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload

from data_ingestion.models import (
    DatasetGroup,
    SchemaDataset,
    SchemaDatasetLink,
    SchemaProposal,
    SchemaProposalAuditLog,
)
from data_ingestion.schemas.schema_registry import (
    DatasetImportError,
    DatasetImportResponse,
    DatasetVersion,
    ProposalDiffField,
    RegistryColumn,
    ResolvedRegistryColumn,
    ResolvedSchemaResponse,
    SchemaImpactMember,
    SchemaImpactResponse,
    SchemaVersionReference,
)
from data_ingestion.utils.schema import sort_schema_columns_key

# Fields compared when diffing two column states (proposal before/after, or
# two versions). Keep in sync with RegistryColumn.
REGISTRY_COLUMN_FIELDS = [
    "name",
    "data_type",
    "is_nullable",
    "is_important",
    "is_system_generated",
    "description",
    "primary_key",
    "partition_order",
    "license",
    "units",
    "hint",
    "is_mandatory",
    "is_unique",
    "domain_values",
    "range_min",
    "range_max",
    "dynamic_max",
    "precision_min",
    "critical_for",
]


# ---------------------------------------------------------------------------
# Delta reads (via Trino) — current column state and version history live in
# Delta, not in a Postgres copy.
# ---------------------------------------------------------------------------


def get_registry_columns(
    dataset_key: str,
    trino_db: Session,
    *,
    as_of_version: int | None = None,
) -> list[RegistryColumn]:
    version_clause = (
        f" FOR VERSION AS OF {int(as_of_version)}" if as_of_version is not None else ""
    )
    res = trino_db.execute(
        text(f"SELECT * FROM schemas.{dataset_key}{version_clause}")  # nosec B608
    )
    columns = [RegistryColumn(**dict(m)) for m in res.mappings().all()]
    return sorted(columns, key=sort_schema_columns_key)


def count_registry_columns(dataset_key: str, trino_db: Session) -> int:
    return trino_db.execute(
        text(f"SELECT count(*) FROM schemas.{dataset_key}")  # nosec B608
    ).scalar_one()


def get_registry_column(
    dataset_key: str,
    column_name: str,
    trino_db: Session,
    *,
    as_of_version: int | None = None,
) -> RegistryColumn | None:
    for col in get_registry_columns(dataset_key, trino_db, as_of_version=as_of_version):
        if col.name == column_name:
            return col
    return None


def list_dataset_versions(dataset_key: str, trino_db: Session) -> list[dict]:
    res = trino_db.execute(
        text(
            f"SELECT version, timestamp, operation, operation_parameters "  # nosec B608
            f'FROM schemas."{dataset_key}$history" ORDER BY version DESC'
        )
    )
    return [dict(m) for m in res.mappings().all()]


def get_current_dataset_version(dataset_key: str, trino_db: Session) -> int | None:
    versions = list_dataset_versions(dataset_key, trino_db)
    return versions[0]["version"] if versions else None


async def list_dataset_versions_with_proposals(
    db: AsyncSession, trino_db: Session, dataset: SchemaDataset
) -> list[DatasetVersion]:
    history = list_dataset_versions(dataset.key, trino_db)
    proposals = await db.scalars(
        select(SchemaProposal).where(
            SchemaProposal.dataset_id == dataset.id,
            SchemaProposal.delta_version.isnot(None),
        )
    )
    by_version = {p.delta_version: p for p in proposals}

    versions = []
    for row in history:
        proposal = by_version.get(row["version"])
        versions.append(
            DatasetVersion(
                version=row["version"],
                timestamp=row["timestamp"],
                operation=row.get("operation"),
                proposal_id=proposal.id if proposal else None,
                approved_by_email=proposal.proposed_by_email if proposal else None,
            )
        )
    return versions


def diff_columns(
    before: RegistryColumn | None, after: RegistryColumn | None
) -> list[ProposalDiffField]:
    before_dict = before.model_dump() if before else {}
    after_dict = after.model_dump() if after else {}
    diffs = []
    for field in REGISTRY_COLUMN_FIELDS:
        b, a = before_dict.get(field), after_dict.get(field)
        if b != a:
            diffs.append(ProposalDiffField(field=field, before=b, after=a))
    return diffs


# ---------------------------------------------------------------------------
# Groups & datasets (Postgres governance metadata)
# ---------------------------------------------------------------------------


async def list_groups(db: AsyncSession) -> list[DatasetGroup]:
    return list(await db.scalars(select(DatasetGroup).order_by(DatasetGroup.name)))


async def get_group_by_key(db: AsyncSession, key: str) -> DatasetGroup:
    group = await db.scalar(select(DatasetGroup).where(DatasetGroup.key == key))
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Schema group not found")
    return group


async def get_group_detail(
    db: AsyncSession, trino_db: Session, key: str
) -> DatasetGroup:
    group = await get_group_by_key(db, key)
    datasets = list(
        await db.scalars(
            select(SchemaDataset)
            .where(SchemaDataset.group_id == group.id)
            .order_by(SchemaDataset.role, SchemaDataset.name)
        )
    )
    pending_counts = await _pending_proposal_counts_by_dataset(db)
    for dataset in datasets:
        dataset.column_count = count_registry_columns(dataset.key, trino_db)
        dataset.pending_proposal_count = pending_counts.get(dataset.id, 0)
    group.core_schema = next(
        (dataset for dataset in datasets if dataset.role == "core"), None
    )
    group.member_schemas = [dataset for dataset in datasets if dataset.role == "member"]
    return group


async def create_group(
    db: AsyncSession, *, key: str, name: str, description: str | None
) -> DatasetGroup:
    if await db.scalar(select(DatasetGroup).where(DatasetGroup.key == key)):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Group key already exists")
    group = DatasetGroup(key=key, name=name, description=description)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


async def _pending_proposal_count(db: AsyncSession, dataset_id: str) -> int:
    return (
        await db.scalar(
            select(func.count())
            .select_from(SchemaProposal)
            .where(
                SchemaProposal.status == "pending",
                SchemaProposal.dataset_id == dataset_id,
            )
        )
        or 0
    )


async def _pending_proposal_counts_by_dataset(db: AsyncSession) -> dict[str, int]:
    rows = await db.execute(
        select(SchemaProposal.dataset_id, func.count())
        .where(SchemaProposal.status == "pending")
        .group_by(SchemaProposal.dataset_id)
    )
    return dict(rows.all())


async def list_datasets(db: AsyncSession, trino_db: Session) -> list[SchemaDataset]:
    datasets = list(await db.scalars(select(SchemaDataset).order_by(SchemaDataset.key)))
    pending_counts = await _pending_proposal_counts_by_dataset(db)
    # One Trino round trip per dataset — acceptable at this app's scale, but
    # worth revisiting (e.g. caching) if the dataset count grows significantly.
    for dataset in datasets:
        dataset.column_count = count_registry_columns(dataset.key, trino_db)
        dataset.pending_proposal_count = pending_counts.get(dataset.id, 0)
    return datasets


async def create_dataset(
    db: AsyncSession,
    trino_db: Session,
    *,
    key: str,
    name: str | None = None,
    description: str | None = None,
    group_id: str | None,
    role: str = "member",
) -> SchemaDataset:
    if await db.scalar(select(SchemaDataset).where(SchemaDataset.key == key)):
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Dataset already registered"
        )
    await _validate_dataset_placement(db, group_id=group_id, role=role)
    await _validate_placement_columns(
        db,
        trino_db,
        dataset_key=key,
        group_id=group_id,
        role=role,
    )
    dataset = SchemaDataset(
        key=key,
        name=name or key.replace("_", " ").title(),
        description=description,
        group_id=group_id,
        role=role,
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    return dataset


async def get_dataset_by_key(db: AsyncSession, key: str) -> SchemaDataset:
    dataset = await db.scalar(select(SchemaDataset).where(SchemaDataset.key == key))
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset


async def get_dataset_detail(
    db: AsyncSession, trino_db: Session, key: str
) -> SchemaDataset:
    dataset = await get_dataset_by_key(db, key)
    dataset.column_count = count_registry_columns(dataset.key, trino_db)
    dataset.pending_proposal_count = await _pending_proposal_count(db, dataset.id)
    return dataset


async def move_dataset(
    db: AsyncSession,
    trino_db: Session,
    key: str,
    group_id: str | None,
    role: str | None = None,
) -> SchemaDataset:
    dataset = await get_dataset_by_key(db, key)
    next_role = role or dataset.role
    await _validate_dataset_placement(
        db,
        group_id=group_id,
        role=next_role,
        exclude_dataset_id=dataset.id,
    )
    await _validate_placement_columns(
        db,
        trino_db,
        dataset_key=dataset.key,
        group_id=group_id,
        role=next_role,
        exclude_dataset_id=dataset.id,
    )
    dataset.group_id = group_id
    dataset.role = next_role
    await db.commit()
    await db.refresh(dataset)
    return dataset


async def _validate_dataset_placement(
    db: AsyncSession,
    *,
    group_id: str | None,
    role: str,
    exclude_dataset_id: str | None = None,
) -> None:
    if role not in {"core", "member"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid schema role")
    if role == "core" and group_id is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="A core schema must belong to a schema group",
        )
    if group_id is None:
        return
    if await db.get(DatasetGroup, group_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Schema group not found")
    if role != "core":
        return
    query = select(SchemaDataset).where(
        SchemaDataset.group_id == group_id,
        SchemaDataset.role == "core",
    )
    if exclude_dataset_id is not None:
        query = query.where(SchemaDataset.id != exclude_dataset_id)
    if await db.scalar(query):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="This schema group already has a core schema",
        )


async def _validate_placement_columns(
    db: AsyncSession,
    trino_db: Session,
    *,
    dataset_key: str,
    group_id: str | None,
    role: str,
    exclude_dataset_id: str | None = None,
) -> None:
    if group_id is None:
        return

    candidate_columns = get_registry_columns(dataset_key, trino_db)
    if role == "member":
        query = select(SchemaDataset).where(
            SchemaDataset.group_id == group_id,
            SchemaDataset.role == "core",
        )
        if exclude_dataset_id is not None:
            query = query.where(SchemaDataset.id != exclude_dataset_id)
        core = await db.scalar(query)
        if core is None:
            return
        duplicates = _duplicate_column_names(
            get_registry_columns(core.key, trino_db), candidate_columns
        )
        if duplicates:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=(
                    f"Schema duplicates columns owned by core {core.key}: "
                    + ", ".join(duplicates)
                ),
            )
        return

    query = select(SchemaDataset).where(
        SchemaDataset.group_id == group_id,
        SchemaDataset.role == "member",
    )
    if exclude_dataset_id is not None:
        query = query.where(SchemaDataset.id != exclude_dataset_id)
    members = list(await db.scalars(query))
    conflicts: dict[str, list[str]] = {}
    for member in members:
        duplicates = _duplicate_column_names(
            candidate_columns, get_registry_columns(member.key, trino_db)
        )
        if duplicates:
            conflicts[member.key] = duplicates
    if conflicts:
        details = "; ".join(
            f"{member_key}: {', '.join(column_names)}"
            for member_key, column_names in sorted(conflicts.items())
        )
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Core schema conflicts with member columns ({details})",
        )


async def get_group_core(
    db: AsyncSession, dataset: SchemaDataset
) -> SchemaDataset | None:
    if dataset.group_id is None:
        return None
    return await db.scalar(
        select(SchemaDataset).where(
            SchemaDataset.group_id == dataset.group_id,
            SchemaDataset.role == "core",
        )
    )


def _duplicate_column_names(
    core_columns: list[RegistryColumn], member_columns: list[RegistryColumn]
) -> list[str]:
    core_names = {column.name for column in core_columns}
    return sorted(core_names.intersection(column.name for column in member_columns))


async def get_resolved_schema(
    db: AsyncSession,
    trino_db: Session,
    dataset_key: str,
    *,
    member_version: int | None = None,
    core_version: int | None = None,
) -> ResolvedSchemaResponse:
    dataset = await get_dataset_by_key(db, dataset_key)
    if dataset.group_id is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Schema must belong to a group before it can be resolved",
        )
    group = await db.get(DatasetGroup, dataset.group_id)
    member_columns = get_registry_columns(
        dataset.key, trino_db, as_of_version=member_version
    )
    core = await get_group_core(db, dataset)

    # A core schema is governed like any other schema, but cannot be applied by
    # itself. This endpoint is therefore for member schemas only.
    if dataset.role == "core":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Core schemas cannot be resolved independently",
        )

    core_columns: list[RegistryColumn] = []
    if core is not None:
        core_columns = get_registry_columns(
            core.key, trino_db, as_of_version=core_version
        )
        duplicates = _duplicate_column_names(core_columns, member_columns)
        if duplicates:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=(
                    "Member schema duplicates core-owned column(s): "
                    + ", ".join(duplicates)
                ),
            )

    columns = [
        ResolvedRegistryColumn(
            **column.model_dump(),
            origin="core",
            owner_schema_key=core.key,
            read_only=True,
        )
        for column in core_columns
    ]
    columns.extend(
        ResolvedRegistryColumn(
            **column.model_dump(),
            origin="member",
            owner_schema_key=dataset.key,
            read_only=False,
        )
        for column in member_columns
    )
    columns.sort(key=sort_schema_columns_key)

    return ResolvedSchemaResponse(
        schema=SchemaVersionReference(
            key=dataset.key,
            version=member_version
            if member_version is not None
            else get_current_dataset_version(dataset.key, trino_db),
        ),
        group=group,
        core_schema=(
            SchemaVersionReference(
                key=core.key,
                version=core_version
                if core_version is not None
                else get_current_dataset_version(core.key, trino_db),
            )
            if core is not None
            else None
        ),
        columns=columns,
    )


async def get_core_impact(
    db: AsyncSession, trino_db: Session, dataset_key: str
) -> SchemaImpactResponse:
    core = await get_dataset_by_key(db, dataset_key)
    if core.role != "core":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Impact is only available for core schemas",
        )
    core_columns = get_registry_columns(core.key, trino_db)
    core_version = get_current_dataset_version(core.key, trino_db)
    members = list(
        await db.scalars(
            select(SchemaDataset)
            .where(
                SchemaDataset.group_id == core.group_id,
                SchemaDataset.role == "member",
            )
            .order_by(SchemaDataset.name)
        )
    )
    affected_members = []
    for member in members:
        member_columns = get_registry_columns(member.key, trino_db)
        duplicates = _duplicate_column_names(core_columns, member_columns)
        if duplicates:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=(
                    f"{member.key} duplicates core-owned column(s): "
                    + ", ".join(duplicates)
                ),
            )
        affected_members.append(
            SchemaImpactMember(
                key=member.key,
                name=member.name,
                member_version=get_current_dataset_version(member.key, trino_db),
                current_core_version=core_version,
                resolved_column_count=len(core_columns) + len(member_columns),
            )
        )
    return SchemaImpactResponse(
        core_schema_key=core.key,
        core_version=core_version,
        affected_members=affected_members,
    )


async def list_links(db: AsyncSession, dataset_key: str) -> list[SchemaDatasetLink]:
    dataset = await get_dataset_by_key(db, dataset_key)
    return list(
        await db.scalars(
            select(SchemaDatasetLink).where(SchemaDatasetLink.dataset_id == dataset.id)
        )
    )


async def create_link(
    db: AsyncSession, dataset_key: str, linked_dataset_key: str
) -> SchemaDatasetLink:
    dataset = await get_dataset_by_key(db, dataset_key)
    linked = await get_dataset_by_key(db, linked_dataset_key)
    if dataset.id == linked.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Cannot link a dataset to itself"
        )

    # Links are symmetric — create both directions so either dataset's link
    # list shows the other.
    link = await db.scalar(
        select(SchemaDatasetLink).where(
            SchemaDatasetLink.dataset_id == dataset.id,
            SchemaDatasetLink.linked_dataset_id == linked.id,
        )
    )
    if link is None:
        link = SchemaDatasetLink(dataset_id=dataset.id, linked_dataset_id=linked.id)
        db.add(link)

    reverse = await db.scalar(
        select(SchemaDatasetLink).where(
            SchemaDatasetLink.dataset_id == linked.id,
            SchemaDatasetLink.linked_dataset_id == dataset.id,
        )
    )
    if reverse is None:
        db.add(SchemaDatasetLink(dataset_id=linked.id, linked_dataset_id=dataset.id))

    await db.commit()
    await db.refresh(link)
    return link


async def delete_link(
    db: AsyncSession, dataset_key: str, linked_dataset_key: str
) -> None:
    dataset = await get_dataset_by_key(db, dataset_key)
    linked = await get_dataset_by_key(db, linked_dataset_key)
    link = await db.scalar(
        select(SchemaDatasetLink).where(
            SchemaDatasetLink.dataset_id == dataset.id,
            SchemaDatasetLink.linked_dataset_id == linked.id,
        )
    )
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Link not found")
    await db.delete(link)

    reverse = await db.scalar(
        select(SchemaDatasetLink).where(
            SchemaDatasetLink.dataset_id == linked.id,
            SchemaDatasetLink.linked_dataset_id == dataset.id,
        )
    )
    if reverse is not None:
        await db.delete(reverse)

    await db.commit()


# ---------------------------------------------------------------------------
# Proposals & approval
# ---------------------------------------------------------------------------


async def create_proposal(
    db: AsyncSession,
    trino_db: Session,
    *,
    dataset_key: str,
    column_name: str,
    proposal_type: str,
    after_state: dict | None,
    proposed_by_id: str,
    proposed_by_email: str,
) -> SchemaProposal:
    dataset = await get_dataset_by_key(db, dataset_key)
    await _validate_column_ownership(
        db,
        trino_db,
        dataset=dataset,
        column_name=column_name,
        proposal_type=proposal_type,
    )

    existing_pending = await db.scalar(
        select(SchemaProposal).where(
            SchemaProposal.dataset_id == dataset.id,
            SchemaProposal.column_name == column_name,
            SchemaProposal.status == "pending",
        )
    )
    if existing_pending is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="A pending proposal already exists for this column",
        )

    before = get_registry_column(dataset_key, column_name, trino_db)
    if proposal_type == "add" and before is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Column already exists")
    if proposal_type in ("edit", "delete") and before is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Column not found")

    if after_state is not None:
        # after_state keys are later used as SQL column identifiers when the
        # proposal is applied — whitelist them so approval can't be turned
        # into arbitrary column-name injection.
        unknown_fields = set(after_state) - set(REGISTRY_COLUMN_FIELDS)
        if unknown_fields:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown column field(s): {', '.join(sorted(unknown_fields))}",
            )

    proposal = SchemaProposal(
        dataset_id=dataset.id,
        column_name=column_name,
        proposal_type=proposal_type,
        before_state=before.model_dump() if before else None,
        after_state=after_state if proposal_type != "delete" else None,
        proposed_by_id=proposed_by_id,
        proposed_by_email=proposed_by_email,
    )
    db.add(proposal)
    await db.flush()
    db.add(
        SchemaProposalAuditLog(
            proposal_id=proposal.id,
            action="proposed",
            actor_id=proposed_by_id,
            actor_email=proposed_by_email,
        )
    )
    await db.commit()
    await db.refresh(proposal)
    return proposal


async def _validate_column_ownership(
    db: AsyncSession,
    trino_db: Session,
    *,
    dataset: SchemaDataset,
    column_name: str,
    proposal_type: str,
) -> None:
    """Prevent member schemas from shadowing columns owned by their group core."""
    if proposal_type != "add" or dataset.group_id is None:
        return

    if dataset.role == "member":
        core = await get_group_core(db, dataset)
        if core is not None and get_registry_column(core.key, column_name, trino_db):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"Column is owned by core schema {core.key}",
            )
        return

    members = await db.scalars(
        select(SchemaDataset).where(
            SchemaDataset.group_id == dataset.group_id,
            SchemaDataset.role == "member",
        )
    )
    conflicting_members = [
        member.key
        for member in members
        if get_registry_column(member.key, column_name, trino_db) is not None
    ]
    if conflicting_members:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=(
                "Core column conflicts with member schema(s): "
                + ", ".join(sorted(conflicting_members))
            ),
        )


async def list_proposals(
    db: AsyncSession, *, status_filter: str | None, dataset_key: str | None
) -> list[SchemaProposal]:
    query = select(SchemaProposal).order_by(SchemaProposal.created.desc())
    if status_filter:
        query = query.where(SchemaProposal.status == status_filter)
    if dataset_key:
        dataset = await get_dataset_by_key(db, dataset_key)
        query = query.where(SchemaProposal.dataset_id == dataset.id)
    return list(await db.scalars(query))


async def get_proposal(db: AsyncSession, proposal_id: str) -> SchemaProposal:
    proposal = await db.get(SchemaProposal, proposal_id)
    if proposal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    return proposal


async def get_proposal_diff(proposal: SchemaProposal) -> list[ProposalDiffField]:
    before = RegistryColumn(**proposal.before_state) if proposal.before_state else None
    after = RegistryColumn(**proposal.after_state) if proposal.after_state else None
    return diff_columns(before, after)


async def reject_proposal(
    db: AsyncSession,
    proposal_id: str,
    *,
    actor_id: str,
    actor_email: str,
    reason: str,
) -> SchemaProposal:
    proposal = await get_proposal(db, proposal_id)
    if proposal.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Proposal is not pending")

    proposal.status = "rejected"
    proposal.rejection_reason = reason
    db.add(
        SchemaProposalAuditLog(
            proposal_id=proposal.id,
            action="rejected",
            actor_id=actor_id,
            actor_email=actor_email,
        )
    )
    await db.commit()
    await db.refresh(proposal)
    return proposal


def _build_apply_statement(
    dataset_key: str,
    proposal_type: str,
    column_name: str,
    after_state: dict[str, Any] | None,
):
    """Build the Trino statement (text, params) that applies an add/edit/delete
    to the Delta `schemas.<dataset_key>` table."""
    if proposal_type == "delete":
        return (
            text(f"DELETE FROM schemas.{dataset_key} WHERE name = :name"),  # nosec B608
            {"name": column_name},
        )

    state = dict(after_state or {})
    state["name"] = column_name

    if proposal_type == "add":
        state.setdefault("id", str(uuid.uuid4()))
        columns = list(state.keys())
        col_list = ", ".join(columns)
        placeholders = ", ".join(f":{c}" for c in columns)
        return (
            text(
                f"INSERT INTO schemas.{dataset_key} ({col_list}) VALUES ({placeholders})"  # nosec B608
            ),
            state,
        )

    set_clause = ", ".join(f"{c} = :{c}" for c in state if c != "name")
    return (
        text(
            f"UPDATE schemas.{dataset_key} SET {set_clause} WHERE name = :name"  # nosec B608
        ),
        state,
    )


async def approve_proposal(
    db: AsyncSession,
    trino_db: Session,
    proposal_id: str,
    *,
    actor_id: str,
    actor_email: str,
) -> SchemaProposal:
    proposal = await get_proposal(db, proposal_id)
    if proposal.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Proposal is not pending")
    if proposal.proposed_by_id == actor_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Cannot approve your own proposal"
        )

    dataset = await db.get(SchemaDataset, proposal.dataset_id)
    await _validate_column_ownership(
        db,
        trino_db,
        dataset=dataset,
        column_name=proposal.column_name,
        proposal_type=proposal.proposal_type,
    )
    statement, params = _build_apply_statement(
        dataset.key, proposal.proposal_type, proposal.column_name, proposal.after_state
    )

    # NOTE: concurrent approvals against the same dataset can interleave Delta
    # writes — add a per-dataset advisory lock here before this goes live.
    try:
        trino_db.execute(statement, params)
        trino_db.commit()
        new_version = trino_db.execute(
            text(
                f'SELECT version FROM schemas."{dataset.key}$history" '  # nosec B608
                f"ORDER BY version DESC LIMIT 1"
            )
        ).scalar_one()
    except Exception as err:  # noqa: BLE001
        trino_db.rollback()
        proposal.status = "apply_failed"
        proposal.apply_error = str(err)
        db.add(
            SchemaProposalAuditLog(
                proposal_id=proposal.id,
                action="apply_failed",
                actor_id=actor_id,
                actor_email=actor_email,
            )
        )
        await db.commit()
        await db.refresh(proposal)
        return proposal

    proposal.status = "approved"
    proposal.delta_version = new_version
    db.add_all(
        [
            SchemaProposalAuditLog(
                proposal_id=proposal.id,
                action="approved",
                actor_id=actor_id,
                actor_email=actor_email,
            ),
            SchemaProposalAuditLog(
                proposal_id=proposal.id,
                action="applied",
                actor_id=actor_id,
                actor_email=actor_email,
            ),
        ]
    )
    await db.commit()
    await db.refresh(proposal)
    return proposal


async def get_column_history(
    db: AsyncSession, dataset_key: str, column_name: str
) -> list[SchemaProposal]:
    dataset = await get_dataset_by_key(db, dataset_key)
    return list(
        await db.scalars(
            select(SchemaProposal)
            .where(
                SchemaProposal.dataset_id == dataset.id,
                SchemaProposal.column_name == column_name,
            )
            .order_by(SchemaProposal.created.desc())
        )
    )


async def list_audit_log(
    db: AsyncSession,
    *,
    dataset_key: str | None = None,
    column_name: str | None = None,
    actor_id: str | None = None,
    action: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[SchemaProposalAuditLog]:
    query = (
        select(SchemaProposalAuditLog)
        .join(SchemaProposal, SchemaProposalAuditLog.proposal_id == SchemaProposal.id)
        .options(
            selectinload(SchemaProposalAuditLog.proposal).selectinload(
                SchemaProposal.dataset
            )
        )
        .order_by(SchemaProposalAuditLog.created.desc())
        .limit(limit)
        .offset(offset)
    )
    if dataset_key:
        dataset = await get_dataset_by_key(db, dataset_key)
        query = query.where(SchemaProposal.dataset_id == dataset.id)
    if column_name:
        query = query.where(SchemaProposal.column_name == column_name)
    if actor_id:
        query = query.where(SchemaProposalAuditLog.actor_id == actor_id)
    if action:
        query = query.where(SchemaProposalAuditLog.action == action)

    logs = list(await db.scalars(query))
    for log in logs:
        log.dataset_key = log.proposal.dataset.key
        log.column_name = log.proposal.column_name
    return logs


# ---------------------------------------------------------------------------
# Bulk CSV import — upserts columns directly (bypasses individual proposal
# review, same trust level as the admin-only backfill scripts).
# ---------------------------------------------------------------------------

_IMPORT_BOOL_FIELDS = {
    "is_nullable",
    "is_important",
    "is_system_generated",
    "primary_key",
    "is_mandatory",
    "is_unique",
}
_IMPORT_INT_FIELDS = {"partition_order", "precision_min"}
_IMPORT_FLOAT_FIELDS = {"range_min", "range_max"}


def _coerce_import_value(field: str, raw: str) -> Any:
    if field in _IMPORT_BOOL_FIELDS:
        return raw.strip().lower() in ("true", "1", "yes")
    if field in _IMPORT_INT_FIELDS:
        return int(raw)
    if field in _IMPORT_FLOAT_FIELDS:
        return float(raw)
    return raw


def _parse_import_state(row: dict[str, str]) -> dict[str, Any]:
    state: dict[str, Any] = {}
    for field, raw in row.items():
        if field == "name" or field not in REGISTRY_COLUMN_FIELDS:
            continue
        if raw is None or raw.strip() == "":
            continue
        state[field] = _coerce_import_value(field, raw)
    return state


def _apply_import_row(
    dataset_key: str,
    trino_db: Session,
    *,
    row_number: int,
    name: str,
    row: dict[str, str],
    known_names: set[str],
) -> tuple[str | None, DatasetImportError | None]:
    """Apply one CSV row. Returns (outcome, error) where outcome is one of
    "created"/"updated"/"skipped" (countable) or None (error, not counted)."""
    is_edit = name in known_names

    try:
        state = _parse_import_state(row)
    except ValueError as err:
        return None, DatasetImportError(
            row=row_number, detail=f"{name}: invalid value ({err})"
        )

    if not is_edit and "data_type" not in state:
        return None, DatasetImportError(
            row=row_number,
            detail=f"{name}: 'data_type' is required to add a new column",
        )
    if is_edit and not state:
        return "skipped", None

    statement, params = _build_apply_statement(
        dataset_key, "edit" if is_edit else "add", name, state
    )
    try:
        trino_db.execute(statement, params)
        trino_db.commit()
    except Exception as err:  # noqa: BLE001
        trino_db.rollback()
        return None, DatasetImportError(row=row_number, detail=f"{name}: {err}")

    known_names.add(name)
    return ("updated" if is_edit else "created"), None


async def _get_import_column_owners(
    db: AsyncSession,
    trino_db: Session,
    dataset: SchemaDataset,
) -> dict[str, str]:
    """Return columns owned by the other side of a core/member relationship."""
    if dataset.group_id is None:
        return {}
    if dataset.role == "member":
        core = await get_group_core(db, dataset)
        if core is None:
            return {}
        return {
            column.name: core.key for column in get_registry_columns(core.key, trino_db)
        }

    owners: dict[str, str] = {}
    members = await db.scalars(
        select(SchemaDataset).where(
            SchemaDataset.group_id == dataset.group_id,
            SchemaDataset.role == "member",
        )
    )
    for member in members:
        for column in get_registry_columns(member.key, trino_db):
            owners.setdefault(column.name, member.key)
    return owners


async def import_columns_from_csv(
    db: AsyncSession,
    trino_db: Session,
    *,
    dataset_key: str,
    csv_bytes: bytes,
) -> DatasetImportResponse:
    dataset = await get_dataset_by_key(db, dataset_key)

    reader = csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig")))
    if not reader.fieldnames or "name" not in reader.fieldnames:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="CSV must have a 'name' column"
        )

    known_names = {c.name for c in get_registry_columns(dataset_key, trino_db)}
    inherited_owners = await _get_import_column_owners(db, trino_db, dataset)

    counts = {"created": 0, "updated": 0, "skipped": 0}
    errors: list[DatasetImportError] = []

    for row_number, row in enumerate(reader, start=2):  # header is row 1
        name = (row.get("name") or "").strip()
        if not name:
            counts["skipped"] += 1
            continue
        if name not in known_names and name in inherited_owners:
            errors.append(
                DatasetImportError(
                    row=row_number,
                    detail=(
                        f"Column '{name}' is already owned by "
                        f"{inherited_owners[name]}"
                    ),
                )
            )
            continue

        outcome, error = _apply_import_row(
            dataset_key,
            trino_db,
            row_number=row_number,
            name=name,
            row=row,
            known_names=known_names,
        )
        if outcome:
            counts[outcome] += 1
        if error:
            errors.append(error)

    return DatasetImportResponse(**counts, errors=errors)
