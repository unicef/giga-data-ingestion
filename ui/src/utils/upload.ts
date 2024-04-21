import { parse } from "papaparse";
import * as XLSX from "xlsx";
import { utils as xlsxUtils } from "xlsx";

import {
  AcceptedFileTypes,
  AcceptedUnstructuredFileTypes,
  AcceptedUnstructuredMimeTypes,
} from "@/constants/upload.ts";
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

  private commonProcess(detectedColumns: string[]) {
    const { options } = this;

    options.setDetectedColumns(detectedColumns);

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

        const detectedColumns = Object.keys(
          data[0] as Record<string, unknown>[],
        );
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
