import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse } from "@/types/api.ts";
import { DataQualityCheckResult, UploadParams } from "@/types/upload";
import { UploadResponse } from "@/types/upload.ts";

type Files = {
  filename: string;
  uid: string;
  country: string;
  dataset: string;
  source: string;
  timestamp: Date;
}[];

export default function routes(axi: AxiosInstance) {
  return {
    list_files: (): Promise<AxiosResponse<Files>> => {
      return axi.get("/upload/files");
    },

    get_data_quality_check: (
      upload_id: string,
    ): Promise<AxiosResponse<DataQualityCheckResult>> => {
      return axi.get(`upload/data_quality_check/${upload_id}`);
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
