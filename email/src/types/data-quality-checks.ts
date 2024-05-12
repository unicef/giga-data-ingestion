import { z } from "zod";

const Check = z.object({
  assertion: z.string(),
  column: z.string(),
  count_failed: z.number(),
  count_overall: z.number(),
  count_passed: z.number(),
  description: z.string(),
  percent_failed: z.number(),
  percent_passed: z.number(),
  dq_remarks: z.string().optional(),
});

export type Check = z.infer<typeof Check>;

const SummaryCheck = z.object({
  columns: z.number(),
  rows: z.number(),
  timestamp: z.string(),
});

export type SummaryCheck = z.infer<typeof SummaryCheck>;

export const DataQualityCheck = z
  .record(z.union([z.array(Check), SummaryCheck]))
  .and(
    z.object({
      summary: z.optional(SummaryCheck),
    }),
  );

export interface DataQualityCheck {
  [key: string]: Check[] | SummaryCheck;
  critical_error_check?: Check[];
  summary?: SummaryCheck;
}
