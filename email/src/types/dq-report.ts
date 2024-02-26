import { z } from "zod";

export interface DataQualityUploadSuccessProps {
  uploadId: string;
  dataset: string;
  uploadedAt: Date;
}

export const DataQualityUploadSuccessProps = z.object({
  uploadId: z.string(),
  dataset: z.string(),
  uploadedAt: z.date(),
});

export interface DataQualityCheckSuccessProps {
  uploadId: string;
  dataset: string;
  uploadedAt: Date;
  checkedAt: Date;
}

export const DataQualityCheckSuccessProps = z.object({
  uploadId: z.string(),
  dataset: z.string(),
  uploadedAt: z.date(),
  checkedAt: z.date(),
});
