import { z } from "zod";

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
