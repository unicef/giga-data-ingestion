from datetime import datetime
from typing import Any, Literal

from pydantic import UUID4, BaseModel, ConfigDict, Field

ProposalType = Literal["add", "edit", "delete"]
ProposalStatus = Literal["pending", "approved", "rejected", "apply_failed"]
CriticalFor = Literal["always", "create_only"]


class DatasetGroupCreate(BaseModel):
    key: str
    name: str
    description: str | None = None


class DatasetGroupResponse(DatasetGroupCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str


class SchemaDatasetCreate(BaseModel):
    key: str
    group_id: str | None = None


class SchemaDatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    group_id: str | None = None


class SchemaDatasetSummary(SchemaDatasetResponse):
    column_count: int = 0
    pending_proposal_count: int = 0
    current_version: int | None = None


class MoveDatasetRequest(BaseModel):
    group_id: str | None = None


class DatasetLinkCreate(BaseModel):
    linked_dataset_key: str


class DatasetLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    linked_dataset_id: str


class RegistryColumn(BaseModel):
    """A column row as it exists on the Delta `schemas.<dataset>` table, extended
    with the DQ-config fields that used to live only in NocoDB."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    data_type: str
    is_nullable: bool | None = None
    is_important: bool | None = None
    is_system_generated: bool | None = None
    description: str | None = None
    primary_key: bool | None = None
    partition_order: int | None = None
    license: str | None = None
    units: str | None = None
    hint: str | None = None
    is_mandatory: bool | None = None
    is_unique: bool | None = None
    domain_values: str | None = None
    range_min: float | None = None
    range_max: float | None = None
    dynamic_max: str | None = None
    precision_min: int | None = None
    # Only meaningful for master/geolocation datasets — see
    # giga-dagster's data_quality_checks/critical.py. Other dataset types
    # treat every mandatory column as automatically critical.
    critical_for: CriticalFor | None = None


class ProposalCreate(BaseModel):
    column_name: str
    proposal_type: ProposalType
    after_state: dict[str, Any] | None = None


class ProposalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    column_name: str
    proposal_type: ProposalType
    status: ProposalStatus
    before_state: dict[str, Any] | None = None
    after_state: dict[str, Any] | None = None
    proposed_by_id: UUID4
    proposed_by_email: str
    delta_version: int | None = None
    apply_error: str | None = None
    created: datetime


class ProposalDiffField(BaseModel):
    field: str
    before: Any = None
    after: Any = None


class ProposalDetail(ProposalResponse):
    diff: list[ProposalDiffField] = Field(default_factory=list)


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    proposal_id: str
    action: str
    actor_id: UUID4
    actor_email: str
    created: datetime


class DatasetVersion(BaseModel):
    version: int
    timestamp: datetime
    operation: str | None = None
    proposal_id: str | None = None
    approved_by_email: str | None = None
