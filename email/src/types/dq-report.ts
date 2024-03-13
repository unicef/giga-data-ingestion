import { z } from "zod";

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
