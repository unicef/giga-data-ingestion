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

interface ColumnCheck {
  assertion: string;
  description: string;
  data_type: number;
  is_present: number;
  is_correct_datatype: number;
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
