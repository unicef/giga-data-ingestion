import { describe, expect, it } from "vitest";

import {
  buildDqReport,
  getDqCheckGroups,
  getDqReportPayload,
} from "./dq-summary";

const check = (assertion: string, column: string, count_failed: number) => ({
  assertion,
  column,
  description: `${assertion} ${column}`,
  count_failed,
  count_passed: 100 - count_failed,
  count_overall: 100,
  percent_failed: count_failed,
  percent_passed: 100 - count_failed,
  dq_remarks: "",
});

const geolocationSummary = {
  summary: {
    rows: 100,
    columns: 20,
    rows_passed: 80,
    rows_failed: 20,
    rows_passed_with_warnings: 15,
    count_duplicate_school_id: 4,
    count_schools_low_precision_coordinates: 9,
    count_duplicate_location_groups: 2,
    duplicate_location_group_min_size: 3,
  },
  critical_checks: [
    check("is_null_optional", "latitude", 12),
    check("is_null_optional", "longitude", 10),
    check("is_not_within_country", "", 3),
    check("is_null_mandatory", "school_id_govt", 1),
    check("is_null_optional", "school_name", 2),
    check("is_null_optional", "education_level_govt", 5),
  ],
  location_checks: [check("duplicate_location_rows", "location_id", 6)],
};

const geolocationDqReport = {
  version: 1,
  entity: "schools",
  rejected: [
    {
      key: "coordinates",
      label: "Coordinates",
      rows: [
        {
          key: "missing_coordinates",
          kind: "rows",
          label: "Schools with missing coordinates",
          priority: "High",
          count: 12,
          checks: ["is_null_optional-latitude", "is_null_optional-longitude"],
        },
      ],
    },
  ],
  warnings: [
    {
      key: "duplicates",
      label: "Duplicates",
      rows: [
        {
          key: "same_location",
          kind: "rows",
          label: "Schools with the same exact location",
          priority: "Medium",
          count: 6,
          checks: ["duplicate_location_rows_flag"],
        },
        {
          key: "duplicate_location_groups",
          kind: "groups",
          label:
            "Number of groups with 3 or more schools sharing exact location",
          priority: "Low",
          count: 2,
          checks: ["duplicate_location_rows_id"],
          params: { count: 3 },
        },
      ],
    },
  ],
};

const coverageSummary = {
  summary: { rows: 50, columns: 8, rows_passed: 47, rows_failed: 3 },
  critical_checks: [
    check("is_null_mandatory", "school_id_giga", 1),
    check("duplicate", "school_id_giga", 2),
    check("school_not_in_school_master", "", 1),
  ],
};

const coverageDqReport = {
  version: 1,
  entity: "schools",
  rejected: [
    {
      key: "other",
      label: "Other",
      rows: [
        {
          key: "duplicate-school_id_giga",
          kind: "rows",
          label: "duplicate school_id_giga",
          priority: "High",
          count: 2,
          checks: ["duplicate-school_id_giga"],
        },
        {
          key: "is_null_mandatory-school_id_giga",
          kind: "rows",
          label: "school_id_giga is null",
          priority: "High",
          count: 1,
          checks: ["is_null_mandatory-school_id_giga"],
        },
        {
          key: "school_not_in_school_master",
          kind: "rows",
          label: "school does not exist in school master",
          priority: "High",
          count: 1,
          checks: ["school_not_in_school_master"],
        },
      ],
    },
  ],
  warnings: [],
};

const rowCounts = (
  sections: ReturnType<typeof buildDqReport>["rejectedSections"],
) =>
  sections.map(section => [
    section.title,
    section.rows.map(row => [row.label, row.alerts]),
  ]);

describe("buildDqReport without dq_report", () => {
  it("keeps the fixed geolocation tables", () => {
    const report = buildDqReport(geolocationSummary, "geolocation");

    expect(report.rejectedSections.map(section => section.title)).toEqual([
      "Coordinates",
      "School IDs",
      "Other",
    ]);
    expect(report.rejectedSections[0].rows[0]).toMatchObject({
      label: "Schools with missing coordinates",
      alerts: 12,
      priority: "High",
    });
    expect(report.rejectedSections[1].rows[1].alerts).toBe(4);
    expect(report.approvedWithWarnings).toBe(15);
  });

  it("shows geolocation rows at 0 for coverage", () => {
    const report = buildDqReport(coverageSummary, "coverage");
    const alerts = report.rejectedSections.flatMap(section =>
      section.rows.map(row => row.alerts),
    );

    expect(alerts.every(count => count === 0)).toBe(true);
  });
});

describe("buildDqReport with dq_report", () => {
  it("renders the geolocation tables sent by Dagster", () => {
    const report = buildDqReport(
      { ...geolocationSummary, dq_report: geolocationDqReport },
      "geolocation",
    );

    expect(rowCounts(report.rejectedSections)).toEqual([
      ["Coordinates", [["Schools with missing coordinates", 12]]],
    ]);
    expect(report.rejectedSections[0].rows[0]).toMatchObject({
      key: "missing_coordinates",
      priority: "High",
      isGroup: false,
    });
    expect(report.warningSections[0].rows[1]).toEqual({
      key: "duplicate_location_groups",
      label: "Number of groups with 3 or more schools sharing exact location",
      alerts: 2,
      priority: undefined,
      isGroup: true,
    });
  });

  it("keeps the KPI counts from summary", () => {
    const withReport = buildDqReport(
      { ...geolocationSummary, dq_report: geolocationDqReport },
      "geolocation",
    );
    const without = buildDqReport(geolocationSummary, "geolocation");

    expect(withReport.uploaded).toBe(without.uploaded);
    expect(withReport.approved).toBe(without.approved);
    expect(withReport.rejected).toBe(without.rejected);
    expect(withReport.approvedWithWarnings).toBe(15);
  });

  it("falls back to the largest warning row, ignoring group tallies", () => {
    const { rows_passed_with_warnings: _, ...summary } =
      geolocationSummary.summary;
    const report = buildDqReport(
      { ...geolocationSummary, summary, dq_report: geolocationDqReport },
      "geolocation",
    );

    expect(report.approvedWithWarnings).toBe(6);
  });

  it("renders only the coverage checks, without geolocation rows", () => {
    const report = buildDqReport(
      { ...coverageSummary, dq_report: coverageDqReport },
      "coverage",
    );

    expect(rowCounts(report.rejectedSections)).toEqual([
      [
        "Other",
        [
          ["duplicate school_id_giga", 2],
          ["school_id_giga is null", 1],
          ["school does not exist in school master", 1],
        ],
      ],
    ]);
    expect(report.warningSections).toEqual([]);
    expect(report.approvedWithWarnings).toBe(0);
  });

  it("drops an unknown priority", () => {
    const dqReport = structuredClone(coverageDqReport);
    dqReport.rejected[0].rows[0].priority = "Urgent";
    const report = buildDqReport(
      { ...coverageSummary, dq_report: dqReport },
      "coverage",
    );

    expect(report.rejectedSections[0].rows[0].priority).toBeUndefined();
  });
});

describe("dq_report fallback", () => {
  it.each([
    ["an unknown version", { ...geolocationDqReport, version: 2 }],
    [
      "an unknown row kind",
      {
        ...geolocationDqReport,
        rejected: [
          {
            ...geolocationDqReport.rejected[0],
            rows: [{ ...geolocationDqReport.rejected[0].rows[0], kind: "map" }],
          },
        ],
      },
    ],
    ["a malformed payload", { version: 1, rejected: "nope" }],
  ])("uses the fixed tables for %s", (_, dqReport) => {
    const dq = { ...geolocationSummary, dq_report: dqReport };

    expect(getDqReportPayload(dq)).toBeUndefined();
    expect(buildDqReport(dq, "geolocation")).toEqual(
      buildDqReport(geolocationSummary, "geolocation"),
    );
  });
});

describe("getDqCheckGroups", () => {
  it("does not treat dq_report as a check section", () => {
    const groups = getDqCheckGroups({
      ...geolocationSummary,
      dq_report: geolocationDqReport,
    });

    expect(Object.keys(groups)).toEqual(["critical_checks", "location_checks"]);
  });
});
