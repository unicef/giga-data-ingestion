export enum CheckStatusSeverity {
  PASS = "success",
  WARNING = "warning",
  FAIL = "error",
  NO_CHECK = "default",
}

export interface CheckStatus {
  severity: CheckStatusSeverity;
  message: string;
}

export interface UploadCheck {
  key: number;
  columnName: string;
  expectedType: string;
  expectedColumns: CheckStatus;
  fillRate: CheckStatus;
  acceptableValues: CheckStatus;
  remarks: CheckStatus;
}

export interface UploadRouterContext {
  file: File | null;
  timestamp: Date | null;
  uploadDate: string;
  uploadId: string;
}

interface CheckResult {
  assertion: string;
  description: string;
  count_failed: number;
  count_passed: number;
  count_overall: number;
  percent_failed: number;
  percent_passed: number;
  rows_failed: string[];
}

interface UniqueValue {
  name: string;
  count: number;
}

export interface ColumnCheck {
  assertion: string;
  description: string;
  data_type: string;
  is_present: boolean;
  is_correct_datatype: boolean;
  null_values_count: number;
  unique_values_count: number;
  unique_values: UniqueValue[];
  rows_failed: string[];
}

export interface DataQualityCheckResult {
  summary: {
    rows: number;
    columns: number;
    timestamp: Date;
  };
  column_checks: ColumnCheck[];
  duplicate_rows_checks: CheckResult[];
  geospatial_points_checks: CheckResult[];
}

export interface UploadParams {
  column_to_schema_mapping: string;
  country: string;
  data_collection_date: string;
  data_collection_modality: string;
  data_owner: string;
  dataset: string;
  date_modified: string;
  description: string;
  domain: string;
  file: File;
  geolocation_data_source: string;
  pii_classification: string;
  school_id_type: string;
  sensitivity_level: string;
  source?: string | null;
  [key: string]: string | File | null | undefined;
}

export interface UploadResponse {
  id: string;
  created: string;
  uploader_id: string;
  uploader_email: string;
  dq_report_path: string | null;
  country: string;
  dataset: string;
  source: string | null;
  original_filename: string;
  upload_path: string;
  column_to_schema_mapping: string;
}
