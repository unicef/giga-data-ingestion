import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse } from "@/types/api.ts";
import {
  BasicChecks,
  DataQualityCheck,
  UploadParams,
  UploadUnstructuredParams,
} from "@/types/upload";
import { UploadResponse } from "@/types/upload.ts";

export default function routes(axi: AxiosInstance) {
  return {
    get_data_quality_check: (
      upload_id: string,
    ): Promise<AxiosResponse<DataQualityCheck>> => {
      return axi.get(`upload/data_quality_check/${upload_id}`);
    },
    list_uploads: (params?: {
      page?: number;
      page_size?: number;
    }): Promise<AxiosResponse<PagedResponse<UploadResponse>>> => {
      return axi.get("/upload", { params });
    },
    get_upload: (upload_id: string): Promise<AxiosResponse<UploadResponse>> => {
      return axi.get(`upload/${upload_id}`);
    },
    upload: (params: UploadParams): Promise<AxiosResponse<UploadResponse>> => {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) {
          formData.append(key, value);
        }
      });

      return axi.post("/upload", formData, {
        params: { dataset: params.dataset },
      });
    },

    upload_unstructured: (
      params: UploadUnstructuredParams,
    ): Promise<AxiosResponse<null>> => {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) {
          formData.append(key, value);
        }
      });

      return axi.post("/upload/unstructured", formData);
    },

    download_data_quality_check: (params: {
      dataset: string;
      source: string | null;
    }): Promise<AxiosResponse<Blob>> => {
      const { dataset, source } = params;

      return axi.get(`upload/basic_check/${dataset}/download`, {
        params: { source: source },
      });
    },

    download_data_quality_check_results: (
      upload_id: string,
    ): Promise<AxiosResponse<Blob>> => {
      return axi.get(`upload/data_quality_check/${upload_id}/download`, {
        responseType: "blob",
      });
    },

    download_failed_rows: (params: {
      dataset: string;
      country_code: string;
      filename: string;
    }): Promise<AxiosResponse<Blob>> => {
      const { dataset, country_code, filename } = params;

      return axi.get(
        `upload/failed_rows/${dataset}/${country_code}/${filename}`,
        {
          responseType: "blob",
        },
      );
    },

    download_passed_rows: (params: {
      dataset: string;
      country_code: string;
      filename: string;
    }): Promise<AxiosResponse<Blob>> => {
      const { dataset, country_code, filename } = params;

      return axi.get(
        `upload/passed_rows/${dataset}/${country_code}/${filename}`,
        {
          responseType: "blob",
        },
      );
    },
    download_dq_summary: (params: {
      dataset: string;
      country_code: string;
      filename: string;
    }): Promise<AxiosResponse<Blob>> => {
      const { dataset, country_code, filename } = params;

      return axi.get(
        `upload/dq_summary/${dataset}/${country_code}/${filename}`,
        {
          responseType: "blob",
        },
      );
    },

    list_basic_checks: (
      dataset: string,
      source: string | null,
    ): Promise<AxiosResponse<BasicChecks>> => {
      return axi.get(`/upload/basic_check/${dataset}`, {
        params: { source: source },
      });
    },
  };
}
