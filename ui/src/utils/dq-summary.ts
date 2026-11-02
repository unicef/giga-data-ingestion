import {
  DQ_ENTITY_TEXT,
  DQ_REJECTED_SECTIONS,
  DQ_SECTION_ALIASES,
  DQ_WARNING_SECTIONS,
  DqCountSpec,
  DqEntity,
  DqPriority,
  DqSectionKey,
  DqSectionSpec,
} from "@/constants/dqReportSections";
import {
  CREATE_REQUIRED_SCHOOL_COLUMNS,
  IMPORTANT_SCHOOL_COLUMNS,
  REQUIRED_SCHOOL_COLUMNS,
  SCHOOL_CATEGORY_ORDER,
  SCHOOL_COLUMN_CATEGORIES,
} from "@/constants/schoolColumns";
import { Check, DataQualityCheckSummary, Summary } from "@/types/upload";

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

export function getDqEntity(dataset: string): DqEntity {
  return dataset === "health" || dataset === "health-master"
    ? "healthCenters"
    : "schools";
}

type DqSummaryInput = DataQualityCheckSummary | Record<string, unknown>;

/** Concatenated, not first-match: one report can carry two spellings of a section. */
function getSection(dq: DqSummaryInput, key: DqSectionKey): Check[] {
  return DQ_SECTION_ALIASES[key].flatMap(alias => {
    const value = dq[alias];
    return Array.isArray(value) ? (value as Check[]) : [];
  });
}

function failedCount(
  checks: Check[],
  assertion: string,
  column?: string,
): number {
  const check = checks.find(
    c =>
      c.assertion === assertion &&
      (column === undefined || c.column === column),
  );
  return Number(check?.count_failed ?? 0) || 0;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function resolveCount(
  dq: DqSummaryInput,
  summary: Summary,
  spec: DqCountSpec,
): number {
  switch (spec.kind) {
    case "check":
      return failedCount(
        getSection(dq, spec.section),
        spec.assertion,
        spec.column,
      );
    case "maxAcrossColumns": {
      const checks = getSection(dq, spec.section);
      return Math.max(
        0,
        ...spec.columns.map(column =>
          failedCount(checks, spec.assertion, column),
        ),
      );
    }
    case "summary":
      return (
        finiteNumber(summary[spec.field]) ??
        resolveCount(dq, summary, spec.fallback)
      );
  }
}

export interface DqReportRow {
  key: string;
  label: string;
  alerts: number;
  priority?: DqPriority;
  isGroup: boolean;
}

export interface DqReportSection {
  title: string;
  rows: DqReportRow[];
}

function buildSections(
  specs: DqSectionSpec[],
  dq: DqSummaryInput,
  summary: Summary,
  entity: DqEntity,
): DqReportSection[] {
  const text = DQ_ENTITY_TEXT[entity];

  return specs.map(section => ({
    title:
      typeof section.title === "string" ? section.title : section.title[entity],
    rows: section.rows.flatMap<DqReportRow>(row => {
      if ("group" in row) {
        const count = finiteNumber(summary[row.group.count]);
        const minSize = finiteNumber(summary[row.group.minSize]);
        if (count === undefined || minSize === undefined) return [];
        return [
          {
            key: row.text,
            label: text[row.text].replace("{count}", String(minSize)),
            alerts: count,
            isGroup: true,
          },
        ];
      }
      return [
        {
          key: row.text,
          label: text[row.text],
          alerts: resolveCount(dq, summary, row.count),
          priority: row.priority,
          isGroup: false,
        },
      ];
    }),
  }));
}

export interface DqReport {
  uploaded: number;
  approved: number;
  approvedWithWarnings: number;
  rejected: number;
  rejectedSections: DqReportSection[];
  warningSections: DqReportSection[];
}

export function buildDqReport(
  dqSummary: DqSummaryInput | null | undefined,
  dataset: string,
): DqReport {
  const dq = dqSummary ?? {};
  const summary = (dq.summary ?? {}) as Summary;
  const entity = getDqEntity(dataset);

  const uploaded = Number(summary.rows ?? 0) || 0;
  const approved = Number(
    summary.rows_passed ??
      Math.max(uploaded - Number(summary.rows_failed ?? 0), 0),
  );
  const rejected = Number(
    summary.rows_failed ?? Math.max(uploaded - approved, 0),
  );

  const rejectedSections = buildSections(
    DQ_REJECTED_SECTIONS,
    dq,
    summary,
    entity,
  );
  const warningSections = buildSections(
    DQ_WARNING_SECTIONS,
    dq,
    summary,
    entity,
  );

  // Reports that predate rows_passed_with_warnings fall back to the largest
  // single warning, as the PDF does.
  const approvedWithWarnings =
    finiteNumber(summary.rows_passed_with_warnings) ??
    Math.max(
      0,
      ...warningSections.flatMap(section =>
        section.rows.filter(row => !row.isGroup).map(row => row.alerts),
      ),
    );

  return {
    uploaded,
    approved,
    approvedWithWarnings: Math.min(approvedWithWarnings, approved),
    rejected,
    rejectedSections,
    warningSections,
  };
}

export interface ValueMapRow {
  src: string;
  dst: string;
  count: string;
  pct: string;
}

export interface ValueMapSection {
  title: string;
  rows: ValueMapRow[];
}

const VALUE_MAP_SECTIONS = [
  { key: "education", title: "Education level" },
  { key: "electricity", title: "Electricity" },
  { key: "connectivity", title: "Connectivity" },
] as const;

export function getValueMapSections(
  dqSummary: DqSummaryInput | null | undefined,
): ValueMapSection[] {
  const valueMaps = dqSummary?.valueMaps as
    | Partial<Record<string, ValueMapRow[]>>
    | undefined;
  if (!valueMaps || typeof valueMaps !== "object") return [];

  return VALUE_MAP_SECTIONS.flatMap(({ key, title }) => {
    const rows = valueMaps[key];
    return Array.isArray(rows) && rows.length > 0 ? [{ title, rows }] : [];
  });
}

export const INTERNAL_CHECK_COLUMNS = [
  { key: "passed", header: "Passed" },
  { key: "domain", header: "Domain checks" },
  { key: "duplicates", header: "Duplicates" },
  { key: "missing", header: "Missing values" },
] as const;

export type InternalCheckColumnKey =
  typeof INTERNAL_CHECK_COLUMNS[number]["key"];

export interface InternalCheckRow {
  column: string;
  tag?: "required" | "important";
  counts: Record<InternalCheckColumnKey, number>;
}

export interface InternalCheckCategory {
  title: string;
  rows: InternalCheckRow[];
}

// Not part of the column-mapping categories, but grouped in the summary design.
const DEMOGRAPHIC_COLUMNS = [
  "num_students",
  "num_students_boys",
  "num_students_girls",
  "num_students_other",
  "student_refugees",
  "num_students_refugees",
  "num_adm_personnel",
  "num_teachers",
  "num_teachers_female",
  "num_teachers_male",
];

const INTERNAL_COLUMN_CATEGORIES: Record<string, string> = {
  ...SCHOOL_COLUMN_CATEGORIES,
  ...Object.fromEntries(
    DEMOGRAPHIC_COLUMNS.map(column => [column, "School Demographics"]),
  ),
};

const INTERNAL_CATEGORY_ORDER = [
  ...SCHOOL_CATEGORY_ORDER.slice(0, 3),
  "School Demographics",
  ...SCHOOL_CATEGORY_ORDER.slice(3),
];

const OTHER_CATEGORY = "Other";

const isSection = (key: string, section: DqSectionKey) =>
  (DQ_SECTION_ALIASES[section] as readonly string[]).includes(key);

const ISSUE_SECTIONS: Record<
  Exclude<InternalCheckColumnKey, "passed">,
  (key: string, check: Check) => boolean
> = {
  domain: key => isSection(key, "domain"),
  duplicates: (key, check) =>
    isSection(key, "duplicates") ||
    (isSection(key, "critical") && check.assertion === "duplicate"),
  missing: (key, check) =>
    isSection(key, "missing") ||
    (isSection(key, "critical") && check.assertion.startsWith("is_null")),
};

function columnTag(column: string): InternalCheckRow["tag"] {
  if (
    REQUIRED_SCHOOL_COLUMNS.has(column) ||
    CREATE_REQUIRED_SCHOOL_COLUMNS.has(column)
  ) {
    return "required";
  }
  if (IMPORTANT_SCHOOL_COLUMNS.has(column)) return "important";
  return undefined;
}

/**
 * Per-column view of the single-column checks. Each cell is the largest
 * failure count among that column's checks of the kind, and "Passed" is the
 * smallest pass count, so overlapping checks are not double counted.
 */
export function pivotChecksByColumn(
  dqSummary: DqSummaryInput | null | undefined,
  dataset: string,
): InternalCheckCategory[] {
  if (!dqSummary) return [];

  const isSchool = getDqEntity(dataset) === "schools";
  const byColumn = new Map<string, InternalCheckRow>();
  const minPassed = new Map<string, number>();

  for (const [key, value] of Object.entries(dqSummary)) {
    if (!Array.isArray(value)) continue;

    for (const check of value as Check[]) {
      const column = check.column ?? "";
      if (!column || column.includes(",")) continue;

      const kinds = (
        Object.keys(ISSUE_SECTIONS) as (keyof typeof ISSUE_SECTIONS)[]
      ).filter(kind => ISSUE_SECTIONS[kind](key, check));
      if (kinds.length === 0) continue;

      const row = byColumn.get(column) ?? {
        column,
        tag: isSchool ? columnTag(column) : undefined,
        counts: { passed: 0, domain: 0, duplicates: 0, missing: 0 },
      };
      for (const kind of kinds) {
        row.counts[kind] = Math.max(row.counts[kind], check.count_failed ?? 0);
      }
      minPassed.set(
        column,
        Math.min(minPassed.get(column) ?? Infinity, check.count_passed ?? 0),
      );
      byColumn.set(column, row);
    }
  }

  const categories = new Map<string, InternalCheckRow[]>();
  for (const row of byColumn.values()) {
    row.counts.passed = minPassed.get(row.column) ?? 0;
    const category =
      (isSchool && INTERNAL_COLUMN_CATEGORIES[row.column]) || OTHER_CATEGORY;
    categories.set(category, [...(categories.get(category) ?? []), row]);
  }

  const order = [
    ...INTERNAL_CATEGORY_ORDER,
    ...[...categories.keys()].filter(
      category => !INTERNAL_CATEGORY_ORDER.includes(category),
    ),
  ];

  return order.flatMap(title => {
    const rows = categories.get(title);
    return rows && rows.length > 0 ? [{ title, rows }] : [];
  });
}

export function matchesSearch(text: string, searchTerm: string) {
  return text.toLowerCase().includes(searchTerm.trim().toLowerCase());
}
