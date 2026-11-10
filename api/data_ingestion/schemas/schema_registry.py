from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ProposalType = Literal["add", "edit", "delete", "promote", "placement"]
ProposalStatus = Literal["pending", "approved", "rejected", "apply_failed"]
CriticalFor = Literal["always", "create_only"]
SchemaRole = Literal["core", "member"]
ColumnOrigin = Literal["core", "member"]
ColumnSource = Literal["government", "system_generated"]


class DatasetGroupCreate(BaseModel):
    key: str
    name: str
    description: str | None = None


class DatasetGroupResponse(DatasetGroupCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    archived_at: datetime | None = None
    archived_by_id: str | None = None
    archived_by_email: str | None = None
    archive_reason: str | None = None


class SchemaDatasetCreate(BaseModel):
    key: str
    name: str | None = None
    description: str | None = None
    group_id: str
    role: SchemaRole = "member"


class SchemaDatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    name: str
    description: str | None = None
    group_id: str | None = None
    role: SchemaRole
    current_version_number: int | None = None
    column_count: int = 0
    pending_proposal_count: int = 0
    archived_at: datetime | None = None
    archived_by_id: str | None = None
    archived_by_email: str | None = None
    archive_reason: str | None = None


class MoveDatasetRequest(BaseModel):
    group_id: str
    role: SchemaRole | None = None


class ArchiveRequest(BaseModel):
    reason: str | None = None


class LifecyclePreview(BaseModel):
    can_archive: bool = True
    can_restore: bool = False
    can_delete: bool = False
    version_count: int = 0
    proposal_count: int = 0
    pending_proposal_count: int = 0
    link_count: int = 0
    upload_count: int = 0
    active_schema_count: int = 0
    archived_schema_count: int = 0
    blockers: list[str] = Field(default_factory=list)


class DatasetGroupDetail(DatasetGroupResponse):
    core_schema: SchemaDatasetResponse | None = None
    member_schemas: list[SchemaDatasetResponse] = Field(default_factory=list)


class DatasetLinkCreate(BaseModel):
    linked_dataset_key: str


class DatasetLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    linked_dataset_id: str


class RegistryColumn(BaseModel):
    """One column in an immutable PostgreSQL schema-version snapshot."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    data_type: str
    is_nullable: bool | None = None
    is_important: bool | None = None
    is_system_generated: bool | None = None
    source: ColumnSource | None = None
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

    @field_validator("data_type", mode="before")
    @classmethod
    def validate_data_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized == "int":
            normalized = "integer"
        supported = {
            "string",
            "integer",
            "long",
            "float",
            "double",
            "timestamp",
            "boolean",
        }
        if normalized not in supported:
            raise ValueError(
                f"Unsupported data type '{value}'. "
                f"Expected one of: {', '.join(sorted(supported))}"
            )
        return normalized

    @field_validator("source", mode="before")
    @classmethod
    def validate_source(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        if normalized == "":
            return None
        supported = {"government", "system_generated"}
        if normalized not in supported:
            raise ValueError(
                f"Unsupported source '{value}'. "
                f"Expected one of: {', '.join(sorted(supported))}"
            )
        return normalized

    @model_validator(mode="after")
    def sync_system_generated_from_source(self) -> "RegistryColumn":
        if self.source == "system_generated":
            self.is_system_generated = True
        elif self.source == "government":
            self.is_system_generated = False
        return self


class ResolvedRegistryColumn(RegistryColumn):
    origin: ColumnOrigin
    owner_schema_key: str
    read_only: bool


class SchemaVersionReference(BaseModel):
    key: str
    version: int | None = None


class ResolvedSchemaResponse(BaseModel):
    schema: SchemaVersionReference
    group: DatasetGroupResponse
    core_schema: SchemaVersionReference | None = None
    columns: list[ResolvedRegistryColumn]


class SchemaImpactMember(BaseModel):
    key: str
    name: str
    member_version: int | None = None
    current_core_version: int | None = None
    resolved_column_count: int


class SchemaImpactResponse(BaseModel):
    core_schema_key: str
    core_version: int | None = None
    affected_members: list[SchemaImpactMember] = Field(default_factory=list)


class ProposalCreate(BaseModel):
    column_name: str | None = None
    proposal_type: ProposalType
    after_state: dict[str, Any] | None = None


class RejectProposalRequest(BaseModel):
    reason: str = Field(min_length=1)


class ProposalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    column_name: str
    proposal_type: ProposalType
    status: ProposalStatus
    before_state: dict[str, Any] | None = None
    after_state: dict[str, Any] | None = None
    proposed_by_id: str
    proposed_by_email: str
    schema_version: int | None = None
    apply_error: str | None = None
    rejection_reason: str | None = None
    created: datetime


class ProposalTargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dataset_id: str
    dataset_key: str | None = None
    operation: str
    expected_version: int | None = None
    before_state: dict[str, Any] | None = None
    after_state: dict[str, Any] | None = None


class AppliedVersion(BaseModel):
    dataset_key: str
    version: int
    operation: str


class ProposalDiffField(BaseModel):
    field: str
    before: Any = None
    after: Any = None


class PromotionOwner(BaseModel):
    key: str
    name: str
    version: int | None = None
    definition_matches: bool
    differences: list[ProposalDiffField] = Field(default_factory=list)


class PromotionPreview(BaseModel):
    source_member_key: str
    core_schema_key: str | None = None
    column: RegistryColumn
    owners: list[PromotionOwner] = Field(default_factory=list)
    affected_member_keys: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    can_promote: bool = False


class ProposalDetail(ProposalResponse):
    diff: list[ProposalDiffField] = Field(default_factory=list)
    affected_schema_keys: list[str] = Field(default_factory=list)
    targets: list[ProposalTargetResponse] = Field(default_factory=list)
    applied_versions: list[AppliedVersion] = Field(default_factory=list)


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    proposal_id: str
    action: str
    actor_id: str
    actor_email: str
    created: datetime
    dataset_key: str | None = None
    column_name: str | None = None


class DatasetVersion(BaseModel):
    version: int
    timestamp: datetime
    operation: str | None = None
    proposal_id: str | None = None
    approved_by_email: str | None = None


class DatasetImportError(BaseModel):
    row: int
    detail: str


class DatasetImportResponse(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[DatasetImportError] = Field(default_factory=list)


class DatasetCreateFromCsvResponse(BaseModel):
    dataset: SchemaDatasetResponse
    import_result: DatasetImportResponse
