import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse } from "@/types/api.ts";
import { DataQualityCheckResult, UploadParams } from "@/types/upload";
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

type Files = {
  filename: string;
  uid: string;
  country: string;
  dataset: string;
  source: string;
  timestamp: Date;
}[];

type BlobProperties = {
  creation_time: Date;
  name: string;
};

export default function routes(axi: AxiosInstance) {
  return {
    list_column_checks: (): Promise<AxiosResponse<Checks>> => {
      return axi.get("/upload/column-checks");
    },
    list_files: (): Promise<AxiosResponse<Files>> => {
      return axi.get("/upload/files");
    },
    get_file_properties: (
      upload_id: string,
    ): Promise<AxiosResponse<BlobProperties>> => {
      return axi.get(`/upload/properties/${upload_id}`);
    },
    get_dq_check_result: (
      upload_id: string,
    ): Promise<AxiosResponse<DataQualityCheckResult>> => {
      return axi.get(`upload/dq_check/${upload_id}`);
    },
    upload: (params: UploadParams): Promise<AxiosResponse<UploadResponse>> => {
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
    list: (params?: {
      page?: number;
      page_size?: number;
    }): Promise<AxiosResponse<PagedResponse<UploadResponse>>> => {
      return axi.get("/upload", { params });
    },
  };
}
