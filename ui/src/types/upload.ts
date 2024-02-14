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
}
