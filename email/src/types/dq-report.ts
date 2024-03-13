import { z } from "zod";
import {
  DataQualityCheck,
  DataQualityCheckSchema,
} from "./data-quality-checks";

export interface DataQualityUploadSuccessProps {
  uploadId: string;
  dataset: string;
  uploadDate: string;
}

export const DataQualityUploadSuccessSchema = z.object({
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

export const DataQualityCheckSuccessSchema = z.object({
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

export const DataQualityReportEmailSchema = z.object({
  dataQualityCheck: z.optional(DataQualityCheckSchema),
  dataset: z.string(),
  uploadDate: z.string(),
  uploadId: z.string(),
});
