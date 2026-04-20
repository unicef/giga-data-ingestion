import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse, PaginationRequest } from "@/types/api.ts";
import {
  ApprovalRequest,
  CountryPendingListing,
  UploadByCountryResponse,
  UploadListing,
  UploadQuery,
} from "@/types/approvalRequests";

export default function routes(axi: AxiosInstance) {
  return {
    listCountries: (
      paginationRequest?: PaginationRequest,
    ): Promise<AxiosResponse<PagedResponse<CountryPendingListing>>> => {
      return axi.get("/approval-requests", { params: paginationRequest });
    },

    listUploads: (
      countryCode: string,
      paginationRequest?: PaginationRequest,
    ): Promise<AxiosResponse<PagedResponse<UploadListing>>> => {
      return axi.get(`/approval-requests/${countryCode}`, {
        params: paginationRequest,
      });
    },

    get: (
      countryCode: string,
      uploadId: string,
      paginationRequest?: PaginationRequest,
      uploadIdsArray?: string[],
    ): Promise<AxiosResponse<ApprovalRequest>> => {
      return axi.post(
        `/approval-requests/${countryCode}/${uploadId}`,
        uploadIdsArray ? { upload_ids: uploadIdsArray } : undefined,
        {
          params: paginationRequest,
        },
      );
    },

    submit: ({
      countryCode,
      uploadId,
      approved_rows = [],
      rejected_rows = [],
    }: {
      countryCode: string;
      uploadId: string;
      approved_rows?: string[];
      rejected_rows?: string[];
    }): Promise<AxiosResponse<void>> => {
      return axi.post(`/approval-requests/${countryCode}/${uploadId}/submit`, {
        approved_rows,
        rejected_rows,
      });
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
