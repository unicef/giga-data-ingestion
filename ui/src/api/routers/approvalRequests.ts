import type { AxiosInstance, AxiosResponse } from "axios";

import type { PagedResponse, PaginationRequest } from "@/types/api.ts";
import type { ApprovalRequest, ApprovalRequestListing } from "@/types/approvalRequests";

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
      return axi.post("approval-requests/upload", { approved_rows, subpath });
    },
  };
}
