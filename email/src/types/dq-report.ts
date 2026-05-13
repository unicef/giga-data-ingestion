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

const Entity = z.object({
  plural: z.string(),
  lowerPlural: z.string(),
  lowerSingular: z.string(),
});

const FieldMappingEntry = z.object({
  from: z.string(),
  to: z.string(),
});

export const DataQualityReportEmailProps = z.object({
  dataQualityCheck: z.optional(DataQualityCheck),
  dataset: z.string(),
  uploadDate: z.string(),
  uploadId: z.string(),
  country: z.string(),
  // Optional fields used by the PDF renderer. The legacy email renderer
  // ignores them; the PDF generator fills them in if present.
  uploadedFileName: z.string().optional(),
  entity: Entity.optional(),
  fieldMapping: z.array(FieldMappingEntry).optional(),
});

export type DataQualityReportEmailProps = z.infer<
  typeof DataQualityReportEmailProps
>;
