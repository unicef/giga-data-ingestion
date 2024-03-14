import { z } from "zod";
import { DataQualityCheck } from "./data-quality-checks";

export interface DataQualityUploadSuccessProps {
  uploadId: string;
  dataset: string;
  uploadDate: string;
}

export const DataQualityUploadSuccessProps = z.object({
  uploadId: z.string(),
  dataset: z.string(),
  uploadDate: z.string(),
});

export interface DataQualityCheckSuccessProps {
  uploadId: string;
  dataset: string;
  uploadDate: string;
  checkDate: string;
}

export const DataQualityCheckSuccessProps = z.object({
  uploadId: z.string(),
  dataset: z.string(),
  uploadDate: z.string(),
  checkDate: z.string(),
});

export interface DataQualityReportEmailProps {
  dataset: string;
  dataQualityCheck?: DataQualityCheck;
  uploadDate: string;
  uploadId: string;
}

export const DataQualityReportEmailProps = z.object({
  dataQualityCheck: z.optional(DataQualityCheck),
  dataset: z.string(),
  uploadDate: z.string(),
  uploadId: z.string(),
});
