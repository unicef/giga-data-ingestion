import { parse } from "papaparse";

import { AcceptedFileTypes } from "@/constants/upload.ts";
import { MetaSchema } from "@/types/schema.ts";

interface DetectHeadersOptions {
  type: AcceptedFileTypes;
  file: File;
  setDetectedColumns: (columns: string[]) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string) => void;
  schema: MetaSchema[];
}

export class HeaderDetector {
  private readonly options: DetectHeadersOptions;

  constructor(options: DetectHeadersOptions) {
    this.options = options;
  }

  public detect() {
    switch (this.options.type) {
      case AcceptedFileTypes.CSV:
        return this.csv();
      case AcceptedFileTypes.JSON:
        return this.json();
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

    options.setIsLoading(false);
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
        options.setIsLoading(false);
      },
      preview: 1,
    });
  }

  private json() {
    const { options } = this;

    const reader = new FileReader();

    reader.onload = e => {
      const result = (e.target?.result ?? null) as string | null;
      if (!result) return;

      try {
        const data = JSON.parse(result);
        if (!Array.isArray(data)) {
          const message = "JSON top-level entity is not an array";
          options.setError(message);
          throw new Error(message);
        }
        if (data.length === 0) {
          const message = "Data is empty";
          options.setError(message);
          throw new Error(message);
        }

        const detectedColumns = Object.keys(data[0]);
        this.commonProcess(detectedColumns);
      } catch (e) {
        console.error(e);
        options.setError(String(e));
      }
    };

    reader.onerror = console.error;

    reader.readAsText(options.file);
  }
}
