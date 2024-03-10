import { AxiosInstance, AxiosResponse } from "axios";

import {
  ApprovalRequest,
  ApprovalRequestListing,
} from "@/types/approvalRequests.ts";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<ApprovalRequestListing[]>> => {
      return axi.get("/approval-requests");
    },
    get: (subpath: string): Promise<AxiosResponse<ApprovalRequest[]>> => {
      const encodedSubpath = encodeURIComponent(subpath);
      return axi.get(`/approval-requests/${encodedSubpath}`);
    },
  };
}
