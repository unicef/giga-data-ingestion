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
}

export const AcceptedUnstructuredMimeTypes = [
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
];

export const MAX_UPLOAD_FILE_SIZE_MB = 10;

export const MAX_UPLOAD_FILE_SIZE_BYTES =
  MAX_UPLOAD_FILE_SIZE_MB * (2 ** 10) ** 2;
