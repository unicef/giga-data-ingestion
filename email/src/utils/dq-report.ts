import { Check, SummaryCheck } from "../types/data-quality-checks";

export const getChecksWithFailures = (checks: Check[]) => {
  return checks.filter((check) => check.count_passed != 100);
};

export function isSummaryCheck(
  obj: Check[] | SummaryCheck
): obj is SummaryCheck {
  return (obj as SummaryCheck).columns !== undefined;
}
