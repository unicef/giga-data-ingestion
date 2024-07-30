import { parse } from "papaparse";
import * as XLSX from "xlsx";
import { utils as xlsxUtils } from "xlsx";
import { z } from "zod";

import {
  AcceptedFileTypes,
  type AcceptedUnstructuredFileTypes,
  AcceptedUnstructuredMimeTypes,
  MAX_UPLOAD_FILE_SIZE_BYTES,
} from "@/constants/upload.ts";
import { convertBytesToMegabytes } from "@/lib/utils.ts";
import type { MetaSchema } from "@/types/schema.ts";

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
      this.image();
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
        `Your file size (${convertBytesToMegabytes(this.options.file.size).toFixed(
          2,
        )} MB) exceeds the limit of 10 MB, please try a smaller file.`,
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

        const detectedColumns = Object.keys(data[0]);
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
        const data = xlsxUtils.sheet_to_json(sheet);
        if (data.length === 0) {
          options.setError("First sheet is empty");
          return;
        }

        const detectedColumns = Object.keys(data[0] as Record<string, unknown>[]);
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

        const uniqueErrors = [...new Set(err.issues.map(err => `"${err.message}"`))];
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

  // private csv() {
  //   const { options } = this;

  //   parse(options.file, {
  //     complete: result => {
  //       const firstColumnValues = (result.data as string[][]).map(
  //         row => row[0],
  //       );

  //       this.commonProcess(firstColumnValues);
  //     },
  //     error: e => {
  //       console.error(e.message);
  //       options.setError(e.message);
  //       options.setIsParsing(false);
  //     },
  //     skipEmptyLines: true,
  //   });
  // }

  // private excel() {
  //   const { options } = this;
  //   let workbook: XLSX.WorkBook;

  //   options.file
  //     .arrayBuffer()
  //     .then(buf => {
  //       try {
  //         workbook = XLSX.read(buf);
  //       } catch (e) {
  //         options.setError("A parsing error occurred. Please try again.");
  //         console.error(e);
  //         return;
  //       }

  //       const firstSheet = workbook.SheetNames[0];
  //       const sheet = workbook.Sheets[firstSheet];
  //       const data = xlsxUtils.sheet_to_json(sheet);
  //       if (data.length === 0) {
  //         options.setError("First sheet is empty");
  //         return;
  //       }

  //       const firstKey = Object.keys(data[0] as Record<string, unknown>)[0];
  //       const firstColumnValues = (data as Record<string, unknown>[]).map(
  //         (row: Record<string, unknown>) => row[firstKey] as string,
  //       );

  //       this.commonProcess(firstColumnValues);
  //     })
  //     .catch(e => {
  //       console.error(e);
  //       options.setError("A parsing error occurred. Please try again.");
  //     });
  // }
}
