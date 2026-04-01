import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse, PaginationRequest } from "@/types/api.ts";
import {
  ApprovalRequest,
  ApprovalRequestListing,
  UploadByCountryResponse,
  UploadQuery,
} from "@/types/approvalRequests";

export default function routes(axi: AxiosInstance) {
  return {
    list: (
      paginationRequest?: PaginationRequest,
    ): Promise<AxiosResponse<PagedResponse<ApprovalRequestListing>>> => {
      return axi.get("/approval-requests", {
        params: paginationRequest,
      });
    },

    get: (
      subpath: string,
      paginationRequest?: PaginationRequest,
      uploadIdsArray?: string[],
    ): Promise<AxiosResponse<ApprovalRequest>> => {
      const encodedSubpath = encodeURIComponent(subpath);

      return axi.post(
        `/approval-requests/${encodedSubpath}`,
        uploadIdsArray ? { upload_ids: uploadIdsArray } : undefined,
        {
          params: paginationRequest,
        },
      );
    },

    upload_approved_rows: ({
      approved_rows,
      subpath,
    }: {
      approved_rows: string[];
      subpath: string;
    }): Promise<AxiosResponse<void>> => {
      return axi.post(`approval-requests/upload`, { approved_rows, subpath });
    },

    uploadedListByCountry: (query: UploadQuery) => {
      const {
        country,
        dataset,
        page,
        page_size,
        upload_id,
        uploaded_by,
        sort_by,
        sort_order,
      } = query;

      return axi.get<UploadByCountryResponse>("upload/by-country", {
        params: {
          country,
          dataset,
          page,
          page_size,
          upload_id,
          uploaded_by,
          sort_by,
          sort_order,
        },
      });
    },
  };
}
