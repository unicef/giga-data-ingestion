import { z } from "zod";
import { DataQualityCheck } from "./data-quality-checks";

export const DataQualityUploadSuccessProps = z.object({
  uploadId: z.string(),
  dataset: z.string(),
  uploadDate: z.string(),
});

export type DataQualityUploadSuccessProps = z.infer<
  typeof DataQualityUploadSuccessProps
>;

export const DataQualityCheckSuccessProps = z.object({
  uploadId: z.string(),
  dataset: z.string(),
  uploadDate: z.string(),
  checkDate: z.string(),
});

export type DataQualityCheckSuccessProps = z.infer<
  typeof DataQualityCheckSuccessProps
>;

export const DataQualityReportEmailProps = z.object({
  dataQualityCheck: z.optional(DataQualityCheck),
  dataset: z.string(),
  uploadDate: z.string(),
  uploadId: z.string(),
});

export type DataQualityReportEmailProps = z.infer<
  typeof DataQualityReportEmailProps
>;
