import { z } from "zod";
export interface Check {
  assertion: string;
  column: string;
  count_failed: number;
  count_overall: number;
  count_passed: number;
  description: string;
  percent_failed: number;
  percent_passed: number;
}
const Check = z.object({
  assertion: z.string(),
  column: z.string(),
  count_failed: z.number(),
  count_overall: z.number(),
  count_passed: z.number(),
  description: z.string(),
  percent_failed: z.number(),
  percent_passed: z.number(),
});

export interface SummaryCheck {
  columns: number;
  rows: number;
  timestamp: string;
}

const SummaryCheck = z.object({
  columns: z.number(),
  rows: z.number(),
  timestamp: z.string(),
});

export interface DataQualityCheck {
  [key: string]: Check[] | SummaryCheck;
  critical_error_check?: Check[];
  summary?: SummaryCheck;
}

export const DataQualityCheck = z
  .record(z.union([z.array(Check), SummaryCheck]))
  .and(
    z.object({
      summary: z.optional(SummaryCheck),
    })
  );
