export interface Check {
  assertion: string;
  column: string;
  description: string;
  count_failed: number;
  count_passed: number;
  count_overall: number;
  percent_failed: number;
  percent_passed: number;
}

export interface DataQualityCheckSummary {
  summary: {
    rows: number;
    columns: number;
    timestamp: Date;
  };
  format_validation_checks: Check[];
  completeness_checks: Check[];
  domain_checks: Check[];
  range_checks: Check[];
  duplicate_rows_checks: Check[];
  geospatial_checks: Check[];
  critical_error_check: Check[];
}

export interface DqFailedRowValues {
  [key: string]: string | number | null;
}

export interface DqFailedRowsFirstFiveRows {
  [checkName: string]: DqFailedRowValues[];
}
export interface DataQualityCheck {
  name: string;
  creation_time: string;
  dq_summary: DataQualityCheckSummary;
  dq_failed_rows_first_five_rows: DqFailedRowsFirstFiveRows;
}

export const initialDataQualityCheck: DataQualityCheck = {
  name: "",
  creation_time: new Date().toISOString(),
  dq_summary: {
    summary: {
      rows: 0,
      columns: 0,
      timestamp: new Date(),
    },
    format_validation_checks: [],
    completeness_checks: [],
    domain_checks: [],
    range_checks: [],
    duplicate_rows_checks: [],
    geospatial_checks: [],
    critical_error_check: [],
  },
  dq_failed_rows_first_five_rows: {},
};

export interface UploadParams {
  column_to_schema_mapping: string;
  column_license: string;
  country: string;
  dataset: string;
  file: File;
  source?: string | null;
  [key: string]: string | File | null | undefined;
}

export const initialUploadResponse: UploadResponse = {
  id: "",
  created: "",
  uploader_id: "",
  uploader_email: "",
  dq_report_path: null,
  country: "",
  dataset: "",
  source: null,
  original_filename: "",
  upload_path: "",
  column_to_schema_mapping: "",
  column_license: "",
};

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
  column_license: string;
}
