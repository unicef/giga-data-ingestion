import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse } from "@/types/api";
import {
  DeleteIdType,
  DeleteRowsResponse,
  DeleteType,
  DeletionRequest,
  PreviewDeleteRowsResponse,
} from "@/types/delete";

export default function routes(axi: AxiosInstance) {
  return {
    preview_delete_rows: (params: {
      country: string;
      delete_type: DeleteType;
      ids?: string[];
      id_type?: DeleteIdType;
    }): Promise<AxiosResponse<PreviewDeleteRowsResponse>> => {
      return axi.post(`/delete/preview`, {
        country: params.country,
        delete_type: params.delete_type,
        ids: params.ids ?? [],
        id_type: params.id_type ?? "school_id_giga",
      });
    },

    delete_rows: (params: {
      country: string;
      delete_type: DeleteType;
      ids?: string[];
      id_type?: DeleteIdType;
      original_filename?: string;
      school_count_override?: number;
      file?: File | null;
    }): Promise<AxiosResponse<DeleteRowsResponse>> => {
      const formData = new FormData();
      formData.append("country", params.country);
      formData.append("delete_type", params.delete_type);
      formData.append("ids", JSON.stringify(params.ids ?? []));
      formData.append("id_type", params.id_type ?? "school_id_giga");
      formData.append("original_filename", params.original_filename ?? "");
      if (params.school_count_override != null) {
        formData.append(
          "school_count_override",
          String(params.school_count_override),
        );
      }
      if (params.file) {
        formData.append("file", params.file);
      }
      return axi.post(`/delete`, formData);
    },

    list_deletion_requests: (params: {
      page: number;
      page_size: number;
    }): Promise<AxiosResponse<PagedResponse<DeletionRequest>>> => {
      return axi.get(`/delete`, { params });
    },
  };
}
