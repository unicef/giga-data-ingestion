import { AxiosInstance, AxiosResponse } from "axios";

import mockDataQualityResults from "@/mocks/data-quality-results.json";
import mockUploadData from "@/mocks/upload.json";
import { mockUploadsData } from "@/mocks/uploads";
import { PagedResponse } from "@/types/api.ts";
import {
  BasicChecks,
  DataQualityCheck,
  UploadParams,
  UploadStructuredParams,
  UploadUnstructuredParams,
} from "@/types/upload";
import { UploadResponse } from "@/types/upload.ts";

export default function routes(axi: AxiosInstance) {
  return {
    get_data_quality_check: (
      upload_id: string,
    ): Promise<AxiosResponse<DataQualityCheck>> => {
      if (!import.meta.env.PROD) {
        return Promise.resolve({
          data: mockDataQualityResults as unknown as DataQualityCheck,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        } as AxiosResponse<DataQualityCheck>);
      }
      return axi.get(`upload/data_quality_check/${upload_id}`);
    },
    list_uploads: (params?: {
      page?: number;
      page_size?: number;
      id_search?: string;
    }): Promise<AxiosResponse<PagedResponse<UploadResponse>>> => {
      // Return mocked data in development/local mode
      if (!import.meta.env.PROD) {
        const page = params?.page ?? 1;
        const page_size = params?.page_size ?? 10;
        const id_search = params?.id_search;

        const mockData = { ...mockUploadsData };

        // Apply id_search filter if provided
        if (id_search) {
          mockData.data = mockData.data.filter(item =>
            item.id.startsWith(id_search),
          );
        }

        // Apply pagination
        const startIdx = (page - 1) * page_size;
        const endIdx = startIdx + page_size;
        const paginatedData = mockData.data.slice(startIdx, endIdx);

        return Promise.resolve({
          data: {
            data: paginatedData,
            page,
            page_size,
            total_count: mockData.data.length,
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        } as AxiosResponse<PagedResponse<UploadResponse>>);
      }

      return axi.get("/upload", { params });
    },
    get_upload: (upload_id: string): Promise<AxiosResponse<UploadResponse>> => {
      if (!import.meta.env.PROD) {
        return Promise.resolve({
          data: mockUploadData as unknown as UploadResponse,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        } as AxiosResponse<UploadResponse>);
      }
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

    upload_structured: (
      params: UploadStructuredParams,
    ): Promise<AxiosResponse<null>> => {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) {
          formData.append(key, value);
        }
      });

      return axi.post("/upload/structured", formData);
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

    download_raw_file: (params: {
      dataset: string;
      country_code: string;
      filename: string;
    }): Promise<AxiosResponse<Blob>> => {
      const { dataset, country_code, filename } = params;

      return axi.get(`upload/raw_file/${dataset}/${country_code}/${filename}`, {
        responseType: "blob",
      });
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
