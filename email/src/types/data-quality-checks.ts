import { z } from "zod";

// Lenient schemas: the on-disk Dagster DQ JSON has section names with spaces
// (e.g. "duplicate checks") and many shape variants between Python pipelines.
// We only validate the bare minimum the PDF generator depends on and pass
// extra fields through.

const Check = z
  .object({
    assertion: z.string().optional(),
    column: z.string().optional(),
    count_failed: z.number().optional(),
    count_overall: z.number().optional(),
    count_passed: z.number().optional(),
    description: z.string().optional(),
    percent_failed: z.number().nullable().optional(),
    percent_passed: z.number().nullable().optional(),
    dq_remarks: z.string().optional(),
  })
  .passthrough();

export type Check = z.infer<typeof Check>;

const SummaryCheck = z
  .object({
    columns: z.number().optional(),
    rows: z.number().optional(),
    rows_passed: z.number().nullable().optional(),
    rows_failed: z.number().nullable().optional(),
    rows_passed_with_warnings: z.number().nullable().optional(),
    count_schools_low_precision_coordinates: z.number().nullable().optional(),
    count_duplicate_school_id: z.number().nullable().optional(),
    schools_created: z.number().nullable().optional(),
    schools_updated: z.number().nullable().optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export type SummaryCheck = z.infer<typeof SummaryCheck>;

export const DataQualityCheck = z
  .record(z.union([z.array(Check), SummaryCheck]))
  .and(
    z.object({
      summary: z.optional(SummaryCheck),
    }),
  );

export interface DataQualityCheck {
  [key: string]: Check[] | SummaryCheck | undefined;
  critical_error_check?: Check[];
  summary?: SummaryCheck;
}

// Rejected and Warnings tables of the DQ report, ready to render (Dagster).
export const DQ_REPORT_VERSION = 1;

const DqReportRow = z.object({
  key: z.string(),
  kind: z.enum(["rows", "groups"]),
  label: z.string(),
  priority: z.string().optional(),
  count: z.number(),
  checks: z.array(z.string()).optional(),
  params: z.object({ count: z.number().optional() }).optional(),
});

const DqReportGroup = z.object({
  key: z.string(),
  label: z.string(),
  rows: z.array(DqReportRow),
});

export const DqReport = z.object({
  version: z.literal(DQ_REPORT_VERSION),
  entity: z.string(),
  rejected: z.array(DqReportGroup),
  warnings: z.array(DqReportGroup),
});

export type DqReport = z.infer<typeof DqReport>;
export type DqReportGroup = z.infer<typeof DqReportGroup>;
