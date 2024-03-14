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

interface SummaryCheck {
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
  completeness_checks: Check[];
  critical_error_check: Check[];
  domain_checks: Check[];
  duplicate_rows_checks: Check[];
  format_validation_checks: Check[];
  geospatial_checks: Check[];
  range_checks: Check[];
  summary: SummaryCheck;
}

export const DataQualityCheck = z.object({
  completeness_checks: z.array(Check),
  critical_error_check: z.array(Check),
  domain_checks: z.array(Check),
  duplicate_rows_checks: z.array(Check),
  format_validation_checks: z.array(Check),
  geospatial_checks: z.array(Check),
  range_checks: z.array(Check),
  summary: SummaryCheck,
});
