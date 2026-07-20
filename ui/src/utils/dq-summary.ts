import { Check, DataQualityCheckSummary } from "@/types/upload";

const DQ_SUMMARY_META_KEYS = new Set([
  "summary",
  "critical_error_check",
  "valueMaps",
]);

/** DQ check tab groups only — excludes summary, valueMaps, and other non-array keys. */
export function getDqCheckGroups(
  dqSummary: DataQualityCheckSummary | Record<string, unknown> | undefined,
): Record<string, Check[]> {
  if (!dqSummary) return {};

  return Object.entries(dqSummary).reduce<Record<string, Check[]>>(
    (groups, [key, value]) => {
      if (DQ_SUMMARY_META_KEYS.has(key)) return groups;
      if (Array.isArray(value)) {
        groups[key] = value as Check[];
      }
      return groups;
    },
    {},
  );
}
