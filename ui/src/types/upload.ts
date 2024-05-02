import { ComponentProps } from "react";

import { Tag } from "@carbon/react";

export interface Check {
  assertion: string;
  column: string;
  description: string;
  count_failed: number;
  count_passed: number;
  count_overall: number;
  percent_failed: number;
  percent_passed: number;
  dq_remarks: string;
}

interface Summary {
  rows: number;
  columns: number;
  timestamp: Date;
}

export interface DataQualityCheckSummary {
  [key: string]: Check[] | Summary;
  summary: Summary;
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
  metadata: string;
}

export interface UploadUnstructuredParams {
  country: string;
  file: File;
  source?: string | null;
  metadata: string;
}

export enum DQStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  TIMEOUT = "TIMEOUT",
  SKIPPED = "SKIPPED",
}

export const DQStatusTagMapping: Record<
  DQStatus,
  ComponentProps<typeof Tag>["type"]
> = {
  [DQStatus.IN_PROGRESS]: "gray",
  [DQStatus.COMPLETED]: "blue",
  [DQStatus.ERROR]: "red",
  [DQStatus.TIMEOUT]: "red",
  [DQStatus.SKIPPED]: "gray",
};

export interface UploadResponse {
  id: string;
  created: string;
  uploader_id: string;
  uploader_email: string;
  dq_report_path: string | null;
  dq_full_path: string | null;
  dq_status: DQStatus;
  bronze_path: string | null;
  is_processed_in_staging: boolean;
  country: string;
  dataset: string;
  source: string | null;
  original_filename: string;
  upload_path: string;
  column_to_schema_mapping: string;
  column_license: string;
}

export const initialUploadResponse: UploadResponse = {
  id: "",
  created: "",
  uploader_id: "",
  uploader_email: "",
  dq_report_path: null,
  dq_full_path: null,
  dq_status: DQStatus.IN_PROGRESS,
  bronze_path: null,
  is_processed_in_staging: false,
  country: "",
  dataset: "",
  source: null,
  original_filename: "",
  upload_path: "",
  column_to_schema_mapping: "",
  column_license: "",
};
