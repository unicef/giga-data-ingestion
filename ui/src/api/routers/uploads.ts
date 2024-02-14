import { AxiosInstance, AxiosResponse } from "axios";

import { UploadResponse } from "@/types/upload.ts";

type Header = {
  key: string;
  header: string;
};

type ColumnCheckRow = {
  id: string;
  columnName: string;
  expectedDataType: string;
  inDataset: string;
  isCorrectLocation: string;
  nullValues: string;
  uniqueValues: string;
};

type DuplicateRow = {
  id: string;
  check: string;
};

type GeospatialDataPoint = DuplicateRow; // Same structure as DuplicateRow

type ColumnChecks = {
  headers: Header[];
  rows: ColumnCheckRow[];
};

type DuplicateRows = {
  headers: Header[];
  rows: DuplicateRow[];
};

type GeospatialDataPoints = {
  headers: Header[];
  rows: GeospatialDataPoint[];
};

type SummaryChecks = {
  columns: string;
  rows: string;
};

type Checks = {
  summary_checks: SummaryChecks;
  column_checks: ColumnChecks;
  duplicate_rows: DuplicateRows;
  geospatial_data_points: GeospatialDataPoints;
};

export default function routes(axi: AxiosInstance) {
  return {
    list_column_checks: (): Promise<AxiosResponse<Checks>> => {
      return axi.get("/upload/column-checks");
    },
    upload_file: (params: {
      dataset: string;
      file: File;
      sensitivity_level: string;
      pii_classification: string;
      geolocation_data_source: string;
      data_collection_modality: string;
      data_collection_date: string;
      domain: string;
      date_modified: string;
      source?: string | null;
      data_owner: string;
      country: string;
      school_id_type: string;
      description: string;
      [key: string]: string | File | null | undefined;
    }): Promise<AxiosResponse<UploadResponse>> => {
      const formData = new FormData();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          formData.append(key, params[key] as string | File);
        }
      });

      return axi.post(`/upload`, formData, {
        params: {
          dataset: params.dataset,
        },
      });
    },
    list_uploads: () => {},
  };
}
