import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse } from "@/types/api.ts";
import { DataQualityCheck, UploadParams } from "@/types/upload";
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
  };
}
