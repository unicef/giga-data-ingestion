export type ProposalType = "add" | "edit" | "delete";
export type ProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "apply_failed";
export type CriticalFor = "always" | "create_only";

export interface DatasetGroup {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

export interface CreateDatasetGroupRequest {
  key: string;
  name: string;
  description?: string | null;
}

export interface SchemaDataset {
  id: string;
  key: string;
  group_id: string | null;
  column_count: number;
  pending_proposal_count: number;
}

export interface RegistryColumn {
  name: string;
  data_type: string;
  is_nullable: boolean | null;
  is_important: boolean | null;
  is_system_generated: boolean | null;
  description: string | null;
  primary_key: boolean | null;
  partition_order: number | null;
  license: string | null;
  units: string | null;
  hint: string | null;
  is_mandatory: boolean | null;
  is_unique: boolean | null;
  domain_values: string | null;
  range_min: number | null;
  range_max: number | null;
  dynamic_max: string | null;
  precision_min: number | null;
  critical_for: CriticalFor | null;
}

export interface CreateProposalRequest {
  column_name: string;
  proposal_type: ProposalType;
  after_state?: Partial<RegistryColumn> | null;
}

export interface Proposal {
  id: string;
  dataset_id: string;
  column_name: string;
  proposal_type: ProposalType;
  status: ProposalStatus;
  before_state: RegistryColumn | null;
  after_state: RegistryColumn | null;
  proposed_by_id: string;
  proposed_by_email: string;
  delta_version: number | null;
  apply_error: string | null;
  rejection_reason: string | null;
  created: string;
}

export interface ProposalDiffField {
  field: string;
  before: unknown;
  after: unknown;
}

export interface ProposalDetail extends Proposal {
  diff: ProposalDiffField[];
}

export interface DatasetVersion {
  version: number;
  timestamp: string;
  operation: string | null;
  proposal_id: string | null;
  approved_by_email: string | null;
}

export interface AuditLogEntry {
  id: string;
  proposal_id: string;
  action: string;
  actor_id: string;
  actor_email: string;
  created: string;
  dataset_key: string | null;
  column_name: string | null;
}

export interface DatasetImportError {
  row: number;
  detail: string;
}

export interface DatasetImportResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: DatasetImportError[];
}
