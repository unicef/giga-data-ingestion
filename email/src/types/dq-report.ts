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
  uploadMetadata: z.record(z.union([z.string(), z.number(), z.null()])).optional(),
  valueMaps: z
    .object({
      education: z
        .array(
          z.object({
            src: z.string(),
            dst: z.string(),
            count: z.string(),
            pct: z.string(),
          })
        )
        .optional(),
      electricity: z
        .array(
          z.object({
            src: z.string(),
            dst: z.string(),
            count: z.string(),
            pct: z.string(),
          })
        )
        .optional(),
      connectivity: z
        .array(
          z.object({
            src: z.string(),
            dst: z.string(),
            count: z.string(),
            pct: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  schoolsCreated: z.union([z.number(), z.string()]).optional(),
  schoolsUpdated: z.union([z.number(), z.string()]).optional(),
});

export type DataQualityReportEmailProps = z.infer<
  typeof DataQualityReportEmailProps
>;
