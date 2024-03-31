import { AxiosInstance, AxiosResponse } from "axios";

import { PagedResponse, PaginationRequest } from "@/types/api.ts";
import {
  ApprovalRequest,
  ApprovalRequestListing,
} from "@/types/approvalRequests";

export default function routes(axi: AxiosInstance) {
  return {
    list: (
      paginationRequest: PaginationRequest,
    ): Promise<AxiosResponse<PagedResponse<ApprovalRequestListing>>> => {
      return axi.get("/approval-requests", {
        params: paginationRequest,
      });
    },
    get: (subpath: string): Promise<AxiosResponse<ApprovalRequest>> => {
      const encodedSubpath = encodeURIComponent(subpath);
      return axi.get(`/approval-requests/${encodedSubpath}`);
    },
    upload_approved_rows: ({
      approved_rows,
      rejected_rows,
      subpath,
    }: {
      approved_rows: string[];
      rejected_rows: string[];
      subpath: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.post(`approval-requests/upload`, {
        approved_rows: approved_rows,
        rejected_rows: rejected_rows,
        subpath: subpath,
      });
    },
  };
}
