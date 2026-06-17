import { parse } from "papaparse";
import * as XLSX from "xlsx";
import { utils as xlsxUtils } from "xlsx";
import { z } from "zod";

import {
  AcceptedFileTypes,
  AcceptedUnstructuredFileTypes,
  AcceptedUnstructuredMimeTypes,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_MB,
} from "@/constants/upload.ts";
import { convertBytesToMegabytes } from "@/lib/utils.ts";
import { MetaSchema } from "@/types/schema.ts";

interface DetectHeadersOptions {
  type: AcceptedFileTypes | AcceptedUnstructuredFileTypes;
  file: File;
  setDetectedColumns: (columns: string[]) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setIsParsing: (isLoading: boolean) => void;
  setError: (error: string) => void;
  schema: MetaSchema[];
}

interface ColumnDetectorOptions {
  type: AcceptedFileTypes;
  file: File;
  setValues: (columns: string[]) => void;
  setIsParsing: (isLoading: boolean) => void;
  setError: (error: string) => void;
}

export class HeaderDetector {
  private readonly options: DetectHeadersOptions;

  constructor(options: DetectHeadersOptions) {
    this.options = options;
  }

  public detect() {
    if (AcceptedUnstructuredMimeTypes.includes(this.options.file.type)) {
      // Handle both image and document files for unstructured uploads
      if (this.options.file.type.startsWith("image/")) {
        this.image();
      } else if (
        this.options.file.type === "text/csv" ||
        this.options.file.type === "application/csv"
      ) {
        this.csv();
      } else if (
        this.options.file.type === "application/vnd.ms-excel" ||
        this.options.file.type === "application/x-ole-storage"
      ) {
        this.excel();
      } else if (
        this.options.file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        this.excel();
      } else if (this.options.file.type === "application/pdf") {
        this.pdf();
      } else if (
        this.options.file.type === "application/msword" ||
        this.options.file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        this.doc();
      } else {
        this.image(); // fallback for other file types
      }
      return;
    }
    switch (this.options.type) {
      case AcceptedFileTypes.CSV:
        this.csv();
        return;
      case AcceptedFileTypes.JSON:
        this.json();
        return;
      case AcceptedFileTypes.EXCEL:
      case AcceptedFileTypes.EXCEL_LEGACY:
        this.excel();
        return;
      default:
      // do nothing
    }
  }

  public validateFileSize() {
    const passed = this.options.file.size <= MAX_UPLOAD_FILE_SIZE_BYTES;
    if (!passed) {
      this.options.setError(
        `Your file size (${convertBytesToMegabytes(
          this.options.file.size,
        ).toFixed(
          2,
        )} MB) exceeds the limit of ${MAX_UPLOAD_FILE_SIZE_MB} MB, please try a smaller file.`,
      );
      this.options.setIsParsing(false);
    }
    return passed;
  }

  private commonProcess(detectedColumns: string[]) {
    const { options } = this;

    options.setDetectedColumns(detectedColumns.filter(col => col.length > 0));

    if (options.schema) {
      const autoColumnMapping: Record<string, string> = {};
      options.schema.forEach(column => {
        if (detectedColumns.includes(column.name)) {
          autoColumnMapping[column.name] = column.name;
        }
      });
      options.setColumnMapping(autoColumnMapping);
    }

    options.setIsParsing(false);
  }

  private csv() {
    const { options } = this;

    parse(options.file, {
      complete: result => {
        const detectedColumns = result.data[0] as string[];
        this.commonProcess(detectedColumns);
      },
      error: e => {
        console.error(e.message);
        options.setError(e.message);
        options.setIsParsing(false);
      },
      preview: 1,
    });
  }

  private json() {
    const { options } = this;

    // TODO: Use alternative streaming implementation to avoid loading the entire file into memory
    const reader = new FileReader();

    reader.onload = e => {
      const result = (e.target?.result ?? null) as string | null;
      if (!result) return;

      try {
        const data = JSON.parse(result);
        if (!Array.isArray(data)) {
          const message = "JSON top-level entity is not an array";
          options.setError(message);
          return;
        }
        if (data.length === 0) {
          const message = "Data is empty";
          options.setError(message);
          return;
        }

        const allKeys = new Set<string>();
        for (const item of data) {
          if (typeof item === "object" && item !== null) {
            for (const key in item) {
              if (Object.prototype.hasOwnProperty.call(item, key)) {
                allKeys.add(key);
              }
            }
          }
        }
        const detectedColumns = Array.from(allKeys);
        this.commonProcess(detectedColumns);
      } catch (e) {
        console.error(e);
        options.setError("A parsing error occurred. Please try again.");
      }
    };

    reader.onerror = console.error;

    reader.readAsText(options.file);
  }

  private excel() {
    const { options } = this;
    let workbook: XLSX.WorkBook;

    options.file
      .arrayBuffer()
      .then(buf => {
        try {
          workbook = XLSX.read(buf);
        } catch (e) {
          options.setError("A parsing error occurred. Please try again.");
          console.error(e);
          return;
        }

        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const data: unknown[][] = xlsxUtils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
        });
        if (data.length === 0) {
          options.setError("First sheet is empty");
          return;
        }

        const detectedColumns = data[0] as string[];
        this.commonProcess(detectedColumns);
      })
      .catch(e => {
        console.error(e);
        options.setError("A parsing error occurred. Please try again.");
      });
  }

  private image() {
    const { options } = this;
    options.setIsParsing(false);
  }

  private pdf() {
    const { options } = this;
    // For PDF files, we don't parse headers, just mark as ready
    options.setIsParsing(false);
    // Set empty columns since we can't parse PDF files for headers
    options.setDetectedColumns([]);
    options.setColumnMapping({});
  }

  private doc() {
    const { options } = this;
    // For DOC files, we don't parse headers, just mark as ready
    options.setIsParsing(false);
    // Set empty columns since we can't parse DOC files for headers
    options.setDetectedColumns([]);
    options.setColumnMapping({});
  }
}

export class ColumnValidator {
  private readonly options: ColumnDetectorOptions;

  constructor(options: ColumnDetectorOptions) {
    this.options = options;
  }

  public validate() {
    // 10 megabytes
    if (this.options.file.size >= MAX_UPLOAD_FILE_SIZE_BYTES) {
      this.options.setError("File size is too big, please try again");
      return;
    }
    switch (this.options.type) {
      case AcceptedFileTypes.JSON:
        this.json();
        return;

      default:
        this.options.setError("Invalid file type, please only upload JSON");
    }
  }

  private commonProcess(columnValues: string[]) {
    const {
      options: { setIsParsing, setValues, setError },
    } = this;

    const UuidArraySchema = z.array(z.string().uuid());

    try {
      UuidArraySchema.parse(columnValues);
      setValues(columnValues);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.log(err);

        const uniqueErrors = [
          ...new Set(err.issues.map(err => `"${err.message}"`)),
        ];
        const uniqueErrorMessage = uniqueErrors.join(", ");
        const message = `Uploaded file contained the following errors on some of the rows: ${uniqueErrorMessage}`;

        setError(message);
      }
    } finally {
      setIsParsing(false);
    }
  }

  private json() {
    const { options } = this;

    // TODO: Use alternative streaming implementation to avoid loading the entire file into memory
    const reader = new FileReader();

    reader.onload = e => {
      const result = (e.target?.result ?? null) as string | null;
      if (!result) return;

      try {
        const data = JSON.parse(result);
        if (!Array.isArray(data)) {
          const message = "JSON top-level entity is not an array";
          options.setError(message);
          return;
        }
        if (data.length === 0) {
          const message = "Data is empty";
          options.setError(message);
          return;
        }

        this.commonProcess(data);
      } catch (e) {
        console.error(e);
        options.setError("A parsing error occurred. Please try again.");
      }
    };

    reader.onerror = console.error;

    reader.readAsText(options.file);
  }

  // private csv() { ... }
  // private excel() { ... }
}

interface DeleteFileParserOptions {
  file: File;
  setValues: (ids: string[]) => void;
  setIsParsing: (loading: boolean) => void;
  setError: (error: string) => void;
}

/**
 * Parses a single-column file (CSV/Excel/JSON) for school ID deletion uploads.
 * CSV/Excel: reads all rows after the header from the first column.
 * JSON: reads the top-level array of strings directly.
 */
export class DeleteFileParser {
  constructor(private options: DeleteFileParserOptions) {}

  parse() {
    const mime = this.options.file.type;
    if (mime === "text/csv" || mime === "application/csv") {
      this.csv();
    } else if (mime === "application/json") {
      this.json();
    } else if (
      mime === "application/vnd.ms-excel" ||
      mime === "application/x-ole-storage" ||
      mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      this.excel();
    } else {
      this.options.setError("Unsupported file type. Use CSV, Excel, or JSON.");
      this.options.setIsParsing(false);
    }
  }

  private csv() {
    parse(this.options.file, {
      complete: result => {
        const rows = result.data as string[][];
        if (rows.length < 2) {
          this.options.setError("File has no data rows after the header.");
          this.options.setIsParsing(false);
          return;
        }
        const ids = rows
          .slice(1)
          .map(row => String(row[0] ?? "").trim())
          .filter(v => v.length > 0);
        if (ids.length === 0) {
          this.options.setError("No valid IDs found in file.");
          this.options.setIsParsing(false);
          return;
        }
        this.options.setValues(ids);
        this.options.setIsParsing(false);
      },
      error: e => {
        console.error(e.message);
        this.options.setError(e.message);
        this.options.setIsParsing(false);
      },
      skipEmptyLines: true,
    });
  }

  private json() {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          this.options.setError(
            "JSON file must contain a top-level array of IDs.",
          );
          this.options.setIsParsing(false);
          return;
        }
        const ids = data
          .map((v: unknown) => String(v).trim())
          .filter((v: string) => v.length > 0);
        if (ids.length === 0) {
          this.options.setError("No valid IDs found in file.");
          this.options.setIsParsing(false);
          return;
        }
        this.options.setValues(ids);
        this.options.setIsParsing(false);
      } catch {
        this.options.setError("Failed to parse JSON file.");
        this.options.setIsParsing(false);
      }
    };
    reader.onerror = () => {
      this.options.setError("Failed to read file.");
      this.options.setIsParsing(false);
    };
    reader.readAsText(this.options.file);
  }

  private excel() {
    this.options.file
      .arrayBuffer()
      .then(buf => {
        let workbook: XLSX.WorkBook;
        try {
          workbook = XLSX.read(buf);
        } catch (e) {
          console.error(e);
          this.options.setError("A parsing error occurred. Please try again.");
          this.options.setIsParsing(false);
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsxUtils.sheet_to_json<string[]>(firstSheet, {
          header: 1,
          blankrows: false,
        });

        if (data.length < 2) {
          this.options.setError("File has no data rows after the header.");
          this.options.setIsParsing(false);
          return;
        }

        const ids = data
          .slice(1)
          .map(row => String(row[0] ?? "").trim())
          .filter(v => v.length > 0);

        if (ids.length === 0) {
          this.options.setError("No valid IDs found in file.");
          this.options.setIsParsing(false);
          return;
        }

        this.options.setValues(ids);
        this.options.setIsParsing(false);
      })
      .catch(e => {
        console.error(e);
        this.options.setError("A parsing error occurred. Please try again.");
        this.options.setIsParsing(false);
      });
  }
}
