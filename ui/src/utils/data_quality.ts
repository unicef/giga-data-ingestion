import { Check } from "@/types/upload";

export const countAssertions = (checks: Check[]) => {
  return checks.reduce(
    (result, check) => {
      if (check.percent_passed === 100.0) {
        result.passed++;
      }
      if (check.percent_failed > 0.0) {
        result.failed++;
      }
      return result;
    },
    { passed: 0, failed: 0 },
  );
};
export const sumAsertions = (checks: Array<Check[]>) => {
  return checks.reduce(
    (acc, check) => {
      const result = countAssertions(check);
      acc.passed += result.passed;
      acc.failed += result.failed;
      return acc;
    },
    { passed: 0, failed: 0 },
  );
};
