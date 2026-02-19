import { AxiosInstance, AxiosResponse } from "axios";

import { mockApprovalRequestsData } from "@/mocks/approvalRequests";
import { PagedResponse, PaginationRequest } from "@/types/api.ts";
import {
  ApprovalRequest,
  ApprovalRequestListing,
} from "@/types/approvalRequests";

export default function routes(axi: AxiosInstance) {
  return {
    list: (
      paginationRequest?: PaginationRequest,
    ): Promise<AxiosResponse<PagedResponse<ApprovalRequestListing>>> => {
      // Return mocked data in development/local mode
      if (!import.meta.env.PROD) {
        const page = paginationRequest?.page ?? 1;
        const page_size = paginationRequest?.page_size ?? 10;

        // Apply pagination
        const startIdx = (page - 1) * page_size;
        const endIdx = startIdx + page_size;
        const paginatedData = mockApprovalRequestsData.data.slice(
          startIdx,
          endIdx,
        );

        return Promise.resolve({
          data: {
            data: paginatedData,
            page,
            page_size,
            total_count:
              mockApprovalRequestsData.total_count ??
              mockApprovalRequestsData.data.length,
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        } as AxiosResponse<PagedResponse<ApprovalRequestListing>>);
      }

      return axi.get("/approval-requests", {
        params: paginationRequest,
      });
    },
    get: (
      subpath: string,
      paginationRequest?: PaginationRequest,
    ): Promise<AxiosResponse<ApprovalRequest>> => {
      const encodedSubpath = encodeURIComponent(subpath);
      return axi.get(`/approval-requests/${encodedSubpath}`, {
        params: paginationRequest,
      });
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
  };
}
