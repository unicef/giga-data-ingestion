import { AxiosInstance, AxiosResponse } from "axios";

import { DataQualityCheckSummary } from "@/types/upload";

export interface DqReportPdfProps {
  dataset: string;
  dataQualityCheck: DataQualityCheckSummary;
  uploadDate: string;
  uploadId: string;
  country: string;
}

export interface DqReportPdfRequest {
  email: string;
  props: DqReportPdfProps;
}

export interface DqReportPdfResponse {
  pdf: string;
  filename: string;
}

export default function routes(axi: AxiosInstance) {
  return {
    getDqReportPdf: (
      body: DqReportPdfRequest,
    ): Promise<AxiosResponse<DqReportPdfResponse>> => {
      return axi.post("email/dq-report-pdf", body);
    },
  };
}
