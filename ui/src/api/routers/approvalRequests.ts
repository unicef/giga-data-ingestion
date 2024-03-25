import { AxiosInstance, AxiosResponse } from "axios";

import {
  ApprovalRequest,
  ApprovalRequestListing,
} from "@/types/approvalReqeuests";

export default function routes(axi: AxiosInstance) {
  return {
    list: (): Promise<AxiosResponse<ApprovalRequestListing[]>> => {
      return axi.get("/approval-requests");
    },
    get: (subpath: string): Promise<AxiosResponse<ApprovalRequest>> => {
      const encodedSubpath = encodeURIComponent(subpath);
      return axi.get(`/approval-requests/${encodedSubpath}`);
    },
    upload_approved_rows: ({
      approved_rows,
      subpath,
    }: {
      approved_rows: string[];
      subpath: string;
    }): Promise<AxiosResponse<null>> => {
      return axi.post(`approval-requests/upload`, {
        approved_rows: approved_rows,
        subpath: subpath,
      });
    },
  };
}
