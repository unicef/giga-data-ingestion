import { Check } from "../types/data-quality-checks";

export const getChecksWithFailures = (checks: Check[]) => {
  return checks.filter((check) => check.count_passed != 100);
};
