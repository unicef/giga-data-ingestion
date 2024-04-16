import { Check, SummaryCheck } from "../types/data-quality-checks";

export const getChecksWithFailures = (checks: Check[]) => {
  return checks.filter(
    (check) => check.percent_passed != 100 || check.dq_remarks === "fail"
  );
};

export function isSummaryCheck(
  obj: Check[] | SummaryCheck
): obj is SummaryCheck {
  return (obj as SummaryCheck).columns !== undefined;
}
