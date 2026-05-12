import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse } from "@/types/api.ts";

export interface ErrorSummary {
  country_code: string;
  dataset_type: string;
  error_count: number;
  distinct_files: number;
}

export interface ErrorRow {
  giga_sync_file_id: string;
  giga_sync_file_name: string;
  dataset_type: string;
  country_code: string;
  school_id_govt: string;
  school_id_giga: string;
  school_name: string;
  latitude: string;
  longitude: string;
  education_level: string;
  failure_reason: string;
  created_at: string;
}

export default function routes(axi: AxiosInstance) {
  return {
    list_upload_errors: (params?: {
      country_code?: string;
      dataset_type?: string;
      file_id?: string;
      page?: number;
      page_size?: number;
    }): Promise<AxiosResponse<PagedResponse<ErrorRow>>> => {
      return axi.get("/error-table", { params });
    },
    get_upload_errors_summary: (): Promise<
      AxiosResponse<{ data: ErrorSummary[] }>
    > => {
      return axi.get("/error-table/summary");
    },
    download_upload_errors: (params?: {
      country_code?: string;
      dataset_type?: string;
      file_id?: string;
    }): Promise<AxiosResponse<Blob>> => {
      return axi.get("/error-table/download", {
        params,
        responseType: "blob",
      });
    },
  };
}
