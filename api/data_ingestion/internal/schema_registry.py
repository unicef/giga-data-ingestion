import csv
import io
from typing import Any

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from data_ingestion.models import (
    DatasetGroup,
    SchemaDataset,
    SchemaDatasetLink,
    SchemaProposal,
    SchemaProposalAuditLog,
    SchemaVersion,
    SchemaVersionColumn,
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
# PostgreSQL schema snapshots
# ---------------------------------------------------------------------------


def _column_response(column: SchemaVersionColumn) -> RegistryColumn:
    return RegistryColumn(
        **{field: getattr(column, field) for field in REGISTRY_COLUMN_FIELDS}
    )


async def get_schema_version(
    db: AsyncSession,
    dataset: SchemaDataset,
    *,
    version: int | None = None,
) -> SchemaVersion | None:
    query = (
        select(SchemaVersion)
        .where(SchemaVersion.dataset_id == dataset.id)
        .options(selectinload(SchemaVersion.columns))
    )
    if version is None:
        if dataset.current_version_id is None:
            return None
        query = query.where(SchemaVersion.id == dataset.current_version_id)
    else:
        query = query.where(SchemaVersion.version == version)
    return await db.scalar(query)


async def get_registry_columns(
    db: AsyncSession,
    dataset_key: str,
    *,
    as_of_version: int | None = None,
) -> list[RegistryColumn]:
    dataset = await get_dataset_by_key(db, dataset_key)
    schema_version = await get_schema_version(db, dataset, version=as_of_version)
    if schema_version is None:
        if as_of_version is not None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"Schema version {as_of_version} not found",
            )
        return []
    return [_column_response(column) for column in schema_version.columns]


async def count_registry_columns(db: AsyncSession, dataset: SchemaDataset) -> int:
    if dataset.current_version_id is None:
        return 0
    return (
        await db.scalar(
            select(func.count())
            .select_from(SchemaVersionColumn)
            .where(SchemaVersionColumn.version_id == dataset.current_version_id)
        )
        or 0
    )


async def get_current_version_number(
    db: AsyncSession, dataset: SchemaDataset
) -> int | None:
    if dataset.current_version_id is None:
        return None
    return await db.scalar(
        select(SchemaVersion.version).where(
            SchemaVersion.id == dataset.current_version_id
        )
    )


async def get_registry_column(
    db: AsyncSession,
    dataset_key: str,
    column_name: str,
    *,
    as_of_version: int | None = None,
) -> RegistryColumn | None:
    for col in await get_registry_columns(db, dataset_key, as_of_version=as_of_version):
        if col.name == column_name:
            return col
    return None


async def list_dataset_versions_with_proposals(
    db: AsyncSession, dataset: SchemaDataset
) -> list[DatasetVersion]:
    versions = list(
        await db.scalars(
            select(SchemaVersion)
            .where(SchemaVersion.dataset_id == dataset.id)
            .order_by(SchemaVersion.version.desc())
        )
    )
    return [
        DatasetVersion(
            version=version.version,
            timestamp=version.created,
            operation=version.source,
            proposal_id=version.proposal_id,
            approved_by_email=version.created_by_email,
        )
        for version in versions
    ]


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


async def get_group_detail(db: AsyncSession, key: str) -> DatasetGroup:
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
        dataset.column_count = await count_registry_columns(db, dataset)
        dataset.current_version_number = await get_current_version_number(db, dataset)
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


async def list_datasets(db: AsyncSession) -> list[SchemaDataset]:
    datasets = list(await db.scalars(select(SchemaDataset).order_by(SchemaDataset.key)))
    pending_counts = await _pending_proposal_counts_by_dataset(db)
    for dataset in datasets:
        dataset.column_count = await count_registry_columns(db, dataset)
        dataset.current_version_number = await get_current_version_number(db, dataset)
        dataset.pending_proposal_count = pending_counts.get(dataset.id, 0)
    return datasets


async def create_dataset(
    db: AsyncSession,
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


async def create_dataset_from_csv(
    db: AsyncSession,
    *,
    key: str,
    name: str | None,
    description: str | None,
    group_id: str | None,
    role: str,
    csv_bytes: bytes,
    actor_id: str,
    actor_email: str,
) -> tuple[SchemaDataset, DatasetImportResponse]:
    if await db.scalar(select(SchemaDataset).where(SchemaDataset.key == key)):
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="Dataset already registered"
        )
    await _validate_dataset_placement(db, group_id=group_id, role=role)
    dataset = SchemaDataset(
        key=key,
        name=name or key.replace("_", " ").title(),
        description=description,
        group_id=group_id,
        role=role,
    )
    db.add(dataset)
    await db.flush()
    inherited_owners = await _get_import_column_owners(db, dataset)
    columns, result = parse_csv_import(csv_bytes, [], inherited_owners)
    if result.errors:
        await db.rollback()
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[error.model_dump() for error in result.errors],
        )
    if not columns:
        await db.rollback()
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The CSV must contain at least one schema column",
        )
    await publish_schema_version(
        db,
        dataset,
        columns,
        source="csv_import",
        actor_id=actor_id,
        actor_email=actor_email,
    )
    await db.commit()
    await db.refresh(dataset)
    dataset.column_count = len(columns)
    dataset.current_version_number = 1
    dataset.pending_proposal_count = 0
    return dataset, result


async def get_dataset_by_key(db: AsyncSession, key: str) -> SchemaDataset:
    dataset = await db.scalar(select(SchemaDataset).where(SchemaDataset.key == key))
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset


async def get_dataset_detail(db: AsyncSession, key: str) -> SchemaDataset:
    dataset = await get_dataset_by_key(db, key)
    dataset.column_count = await count_registry_columns(db, dataset)
    dataset.current_version_number = await get_current_version_number(db, dataset)
    dataset.pending_proposal_count = await _pending_proposal_count(db, dataset.id)
    return dataset


async def move_dataset(
    db: AsyncSession,
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
        dataset=dataset,
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
    *,
    dataset: SchemaDataset,
    group_id: str | None,
    role: str,
    exclude_dataset_id: str | None = None,
) -> None:
    if group_id is None:
        return

    candidate_columns = await get_registry_columns(db, dataset.key)
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
            await get_registry_columns(db, core.key), candidate_columns
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
            candidate_columns, await get_registry_columns(db, member.key)
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
    member_schema_version = await get_schema_version(
        db, dataset, version=member_version
    )
    if member_version is not None and member_schema_version is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"Schema version {member_version} not found for {dataset.key}",
        )
    member_columns = (
        [_column_response(column) for column in member_schema_version.columns]
        if member_schema_version
        else []
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
    core_schema_version: SchemaVersion | None = None
    if core is None and core_version is not None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="A core version was requested but this group has no core schema",
        )
    if core is not None:
        core_schema_version = await get_schema_version(db, core, version=core_version)
        if core_version is not None and core_schema_version is None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"Schema version {core_version} not found for {core.key}",
            )
        core_columns = (
            [_column_response(column) for column in core_schema_version.columns]
            if core_schema_version
            else []
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
    return ResolvedSchemaResponse(
        schema=SchemaVersionReference(
            key=dataset.key,
            version=member_schema_version.version if member_schema_version else None,
        ),
        group=group,
        core_schema=(
            SchemaVersionReference(
                key=core.key,
                version=core_schema_version.version if core_schema_version else None,
            )
            if core is not None
            else None
        ),
        columns=columns,
    )


async def get_core_impact(db: AsyncSession, dataset_key: str) -> SchemaImpactResponse:
    core = await get_dataset_by_key(db, dataset_key)
    if core.role != "core":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Impact is only available for core schemas",
        )
    core_columns = await get_registry_columns(db, core.key)
    core_schema_version = await get_schema_version(db, core)
    core_version = core_schema_version.version if core_schema_version else None
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
        member_columns = await get_registry_columns(db, member.key)
        member_schema_version = await get_schema_version(db, member)
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
                member_version=(
                    member_schema_version.version if member_schema_version else None
                ),
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

    before = await get_registry_column(db, dataset_key, column_name)
    if proposal_type == "add" and before is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Column already exists")
    if proposal_type in ("edit", "delete") and before is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Column not found")

    if after_state is not None:
        unknown_fields = set(after_state) - set(REGISTRY_COLUMN_FIELDS)
        if unknown_fields:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown column field(s): {', '.join(sorted(unknown_fields))}",
            )
    try:
        if proposal_type == "add":
            RegistryColumn(name=column_name, **(after_state or {}))
        elif proposal_type == "edit" and before is not None:
            updated_state = before.model_dump()
            updated_state.update(after_state or {})
            updated_state["name"] = column_name
            RegistryColumn(**updated_state)
    except ValidationError as err:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=err.errors(),
        ) from err

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
        if core is not None and await get_registry_column(db, core.key, column_name):
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
    conflicting_members = []
    for member in members:
        if await get_registry_column(db, member.key, column_name) is not None:
            conflicting_members.append(member.key)
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


async def publish_schema_version(
    db: AsyncSession,
    dataset: SchemaDataset,
    columns: list[RegistryColumn],
    *,
    source: str,
    actor_id: str,
    actor_email: str,
    proposal_id: str | None = None,
) -> SchemaVersion:
    current = await get_schema_version(db, dataset)
    version = SchemaVersion(
        dataset_id=dataset.id,
        version=(current.version + 1) if current else 1,
        source=source,
        created_by_id=actor_id,
        created_by_email=actor_email,
        proposal_id=proposal_id,
    )
    version.columns = [
        SchemaVersionColumn(
            ordinal_position=position,
            **column.model_dump(),
        )
        for position, column in enumerate(columns, start=1)
    ]
    db.add(version)
    await db.flush()
    dataset.current_version_id = version.id
    await db.flush()
    return version


def apply_column_change(
    columns: list[RegistryColumn],
    proposal_type: str,
    column_name: str,
    after_state: dict[str, Any] | None,
) -> list[RegistryColumn]:
    updated = [column.model_copy(deep=True) for column in columns]
    existing_index = next(
        (index for index, column in enumerate(updated) if column.name == column_name),
        None,
    )
    if proposal_type == "delete":
        if existing_index is not None:
            updated.pop(existing_index)
        return updated
    if proposal_type == "add":
        updated.append(RegistryColumn(name=column_name, **dict(after_state or {})))
        return updated
    if existing_index is None:
        return updated
    state = updated[existing_index].model_dump()
    state.update(after_state or {})
    state["name"] = column_name
    updated[existing_index] = RegistryColumn(**state)
    return updated


async def approve_proposal(
    db: AsyncSession,
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

    dataset = await db.scalar(
        select(SchemaDataset)
        .where(SchemaDataset.id == proposal.dataset_id)
        .with_for_update()
    )
    await _validate_column_ownership(
        db,
        dataset=dataset,
        column_name=proposal.column_name,
        proposal_type=proposal.proposal_type,
    )
    columns = await get_registry_columns(db, dataset.key)
    updated_columns = apply_column_change(
        columns,
        proposal.proposal_type,
        proposal.column_name,
        proposal.after_state,
    )
    try:
        version = await publish_schema_version(
            db,
            dataset,
            updated_columns,
            source="proposal",
            actor_id=actor_id,
            actor_email=actor_email,
            proposal_id=proposal.id,
        )
    except Exception as err:  # noqa: BLE001
        await db.rollback()
        proposal = await get_proposal(db, proposal_id)
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
    proposal.schema_version = version.version
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
    if field == "data_type" and raw.strip().lower() == "int":
        return "integer"
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


async def _get_import_column_owners(
    db: AsyncSession,
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
            column.name: core.key for column in await get_registry_columns(db, core.key)
        }

    owners: dict[str, str] = {}
    members = await db.scalars(
        select(SchemaDataset).where(
            SchemaDataset.group_id == dataset.group_id,
            SchemaDataset.role == "member",
        )
    )
    for member in members:
        for column in await get_registry_columns(db, member.key):
            owners.setdefault(column.name, member.key)
    return owners


def parse_csv_import(
    csv_bytes: bytes,
    existing_columns: list[RegistryColumn],
    inherited_owners: dict[str, str],
) -> tuple[list[RegistryColumn], DatasetImportResponse]:
    reader = csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig")))
    if not reader.fieldnames or "name" not in reader.fieldnames:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="CSV must have a 'name' column"
        )

    columns = [column.model_copy(deep=True) for column in existing_columns]
    positions = {column.name: index for index, column in enumerate(columns)}
    counts = {"created": 0, "updated": 0, "skipped": 0}
    errors: list[DatasetImportError] = []
    seen_names: set[str] = set()

    for row_number, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        if not name:
            counts["skipped"] += 1
            continue
        if name in seen_names:
            errors.append(
                DatasetImportError(
                    row=row_number,
                    detail=f"Column '{name}' appears more than once in the CSV",
                )
            )
            continue
        seen_names.add(name)
        if name not in positions and name in inherited_owners:
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
        try:
            state = _parse_import_state(row)
            if name not in positions:
                if "data_type" not in state:
                    raise ValueError("'data_type' is required for new columns")
                columns.append(RegistryColumn(name=name, **state))
                positions[name] = len(columns) - 1
                counts["created"] += 1
            elif not state:
                counts["skipped"] += 1
            else:
                current = columns[positions[name]].model_dump()
                current.update(state)
                current["name"] = name
                columns[positions[name]] = RegistryColumn(**current)
                counts["updated"] += 1
        except (ValidationError, ValueError, TypeError) as err:
            errors.append(DatasetImportError(row=row_number, detail=f"{name}: {err}"))

    return columns, DatasetImportResponse(**counts, errors=errors)


async def import_columns_from_csv(
    db: AsyncSession,
    *,
    dataset_key: str,
    csv_bytes: bytes,
    actor_id: str,
    actor_email: str,
) -> DatasetImportResponse:
    dataset = await db.scalar(
        select(SchemaDataset).where(SchemaDataset.key == dataset_key).with_for_update()
    )
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    existing = await get_registry_columns(db, dataset_key)
    inherited_owners = await _get_import_column_owners(db, dataset)
    columns, result = parse_csv_import(csv_bytes, existing, inherited_owners)
    if result.errors:
        return result
    if result.created or result.updated or dataset.current_version_id is None:
        await publish_schema_version(
            db,
            dataset,
            columns,
            source="csv_import",
            actor_id=actor_id,
            actor_email=actor_email,
        )
        await db.commit()
    return result
