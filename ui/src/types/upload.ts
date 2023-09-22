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
