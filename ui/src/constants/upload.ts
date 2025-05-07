export enum AcceptedFileTypes {
  CSV = ".csv",
  JSON = ".json",
  EXCEL_LEGACY = ".xls",
  EXCEL = ".xlsx",
}

export enum AcceptedUnstructuredFileTypes {
  BMP = ".bmp",
  GIF = ".gif",
  JPG = ".jpg",
  JPEG = ".jpeg",
  PNG = ".png",
  TIF = ".tif",
  TIFF = ".tiff",
  CSV = ".csv",
  EXCEL_LEGACY = ".xls",
  EXCEL = ".xlsx",
  PDF = ".pdf",
  DOC = ".doc",
  DOCX = ".docx",
}

export const AcceptedUnstructuredMimeTypes = [
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const UPLOAD_MODE_OPTIONS = ["Create", "Update"] as const;
export type UploadModeOptions = typeof UPLOAD_MODE_OPTIONS[number];

export const MAX_UPLOAD_FILE_SIZE_MB = 10;

export const MAX_UPLOAD_FILE_SIZE_BYTES =
  MAX_UPLOAD_FILE_SIZE_MB * (2 ** 10) ** 2;
