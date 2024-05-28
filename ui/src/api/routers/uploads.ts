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

    download_data_quality_check: (
      upload_id: string,
    ): Promise<AxiosResponse<Blob>> => {
      return axi.get(`upload/data_quality_check/${upload_id}/download`, {
        responseType: "blob",
      });
    },

    list_basic_checks: (): Promise<AxiosResponse<BasicChecks>> => {
      return axi.get(`/upload/basic_check`);
    },
  };
}
