import { Summary } from "@/types/upload";

// Mirrors the Rejected/Warnings tables of the DQ report PDF
// (email/src/lib/pdf-generator.ts and email/src/i18n/en.json): keep both in sync.

export type DqEntity = "schools" | "healthCenters";

export type DqPriority = "High" | "Medium" | "Low";

export const DQ_SECTION_ALIASES = {
  critical: ["critical_checks", "critical_error_check"],
  duplicates: ["duplicate_checks", "duplicate checks", "duplicate_rows_checks"],
  location: ["location_checks", "location checks", "geospatial_checks"],
  precision: ["precision_checks", "precision checks"],
  domain: ["domain_checks", "domain checks"],
  missing: [
    "missing_value_checks",
    "missing value checks",
    "completeness_checks",
  ],
} as const;

export type DqSectionKey = keyof typeof DQ_SECTION_ALIASES;

type SummaryCountField = {
  [K in keyof Summary]-?: NonNullable<Summary[K]> extends number ? K : never;
}[keyof Summary];

export type DqCountSpec =
  | { kind: "check"; section: DqSectionKey; assertion: string; column?: string }
  | {
      kind: "maxAcrossColumns";
      section: DqSectionKey;
      assertion: string;
      columns: string[];
    }
  | { kind: "summary"; field: SummaryCountField; fallback: DqCountSpec };

export type DqRowSpec =
  | { text: string; priority: DqPriority; count: DqCountSpec }
  | {
      // Dagster reports each group tally with its threshold; older reports
      // carry neither, so the row is omitted instead of shown as 0.
      text: string;
      group: { count: SummaryCountField; minSize: SummaryCountField };
    };

export interface DqSectionSpec {
  title: string | { [E in DqEntity]: string };
  rows: DqRowSpec[];
}

export const DQ_ENTITY_TEXT: Record<DqEntity, Record<string, string>> = {
  schools: {
    approved: "Approved schools",
    rejected: "Rejected schools",
    missingCoordinates: "Schools with missing coordinates",
    outsideCountry: "Schools with coordinates outside the country's limits",
    missingId: "Schools with missing ID",
    duplicateIds: "Schools with duplicate school IDs",
    missingNames: "Schools with missing names",
    missingEducationLevel: "Schools with missing educational level",
    sameLocation: "Schools with the same exact location",
    duplicateLocationGroups:
      "Number of groups with {count} or more schools sharing exact location",
    sameNameLevelLocation:
      "Schools with the same name, educational level, and location",
    identicalExceptId: "Schools identical except for school ID",
    lowPrecision: "Schools with low precision coordinates (less than 5 digits)",
    notInhabitedArea: "Schools not in an inhabited area",
    notNearBuiltEnvironment: "Schools not near a built environment",
    within50m: "Schools within 50m of another school",
    proximity50mGroups:
      "Number of groups with {count} or more schools within 50m of another school",
    similarNameSameLevel110:
      "Schools with similar names and the same educational level within a radius of 110m",
    highDensity: "High Density (more than 5 schools within 500m)",
  },
  healthCenters: {
    approved: "Approved health centers",
    rejected: "Rejected health centers",
    missingCoordinates: "Health Centers with missing coordinates",
    outsideCountry:
      "Health Centers with coordinates outside the country's limits",
    missingId: "Health Centers with missing ID",
    duplicateIds: "Health Centers with duplicate health center IDs",
    missingNames: "Health Centers with missing names",
    missingEducationLevel: "Health Centers with missing educational level",
    sameLocation: "Health Centers with the same exact location",
    duplicateLocationGroups:
      "Number of groups with {count} or more health centers sharing exact location",
    sameNameLevelLocation:
      "Health Centers with the same name, educational level, and location",
    identicalExceptId: "Health Centers identical except for health center ID",
    lowPrecision:
      "Health Centers with low precision coordinates (less than 5 digits)",
    notInhabitedArea: "Health Centers not in an inhabited area",
    notNearBuiltEnvironment: "Health Centers not near a built environment",
    within50m: "Health Centers within 50m of another health center",
    proximity50mGroups:
      "Number of groups with {count} or more health centers within 50m of another health center",
    similarNameSameLevel110:
      "Health Centers with similar names and the same educational level within a radius of 110m",
    highDensity: "High Density (more than 5 health centers within 500m)",
  },
};

export const DQ_REJECTED_SECTIONS: DqSectionSpec[] = [
  {
    title: "Coordinates",
    rows: [
      {
        text: "missingCoordinates",
        priority: "High",
        count: {
          kind: "maxAcrossColumns",
          section: "critical",
          assertion: "is_null_optional",
          columns: ["latitude", "longitude"],
        },
      },
      {
        text: "outsideCountry",
        priority: "High",
        count: {
          kind: "check",
          section: "critical",
          assertion: "is_not_within_country",
        },
      },
    ],
  },
  {
    title: { schools: "School IDs", healthCenters: "Record IDs" },
    rows: [
      {
        text: "missingId",
        priority: "High",
        count: {
          kind: "check",
          section: "critical",
          assertion: "is_null_mandatory",
          column: "school_id_govt",
        },
      },
      {
        text: "duplicateIds",
        priority: "High",
        count: {
          kind: "summary",
          field: "count_duplicate_school_id",
          fallback: {
            kind: "check",
            section: "duplicates",
            assertion: "duplicate",
            column: "school_id_govt",
          },
        },
      },
    ],
  },
  {
    title: "Other",
    rows: [
      {
        text: "missingNames",
        priority: "High",
        count: {
          kind: "check",
          section: "critical",
          assertion: "is_null_optional",
          column: "school_name",
        },
      },
      {
        text: "missingEducationLevel",
        priority: "High",
        count: {
          kind: "check",
          section: "critical",
          assertion: "is_null_optional",
          column: "education_level_govt",
        },
      },
    ],
  },
];

export const DQ_WARNING_SECTIONS: DqSectionSpec[] = [
  {
    title: "Duplicates",
    rows: [
      {
        text: "sameLocation",
        priority: "Medium",
        count: {
          kind: "check",
          section: "location",
          assertion: "duplicate_location_rows",
          column: "location_id",
        },
      },
      {
        text: "duplicateLocationGroups",
        group: {
          count: "count_duplicate_location_groups",
          minSize: "duplicate_location_group_min_size",
        },
      },
      {
        text: "sameNameLevelLocation",
        priority: "Medium",
        count: {
          kind: "check",
          section: "location",
          assertion: "duplicate_set",
          column: "school_name_education_level_location_id",
        },
      },
      {
        text: "identicalExceptId",
        priority: "Medium",
        count: {
          kind: "check",
          section: "duplicates",
          assertion: "duplicate_all_except_school_code",
        },
      },
    ],
  },
  {
    title: "Accuracy",
    rows: [
      {
        text: "lowPrecision",
        priority: "Medium",
        count: {
          kind: "summary",
          field: "count_schools_low_precision_coordinates",
          fallback: {
            kind: "maxAcrossColumns",
            section: "precision",
            assertion: "precision",
            columns: ["latitude", "longitude"],
          },
        },
      },
      {
        text: "notInhabitedArea",
        priority: "Medium",
        count: {
          kind: "check",
          section: "location",
          assertion: "is_in_uninhabited_area",
        },
      },
      {
        text: "notNearBuiltEnvironment",
        priority: "Low",
        count: {
          kind: "check",
          section: "location",
          assertion: "is_suspect_location",
        },
      },
    ],
  },
  {
    title: "Other",
    rows: [
      {
        text: "within50m",
        priority: "Low",
        count: {
          kind: "check",
          section: "location",
          assertion: "duplicate_group_flag_50m",
        },
      },
      {
        text: "proximity50mGroups",
        group: {
          count: "count_proximity_50m_groups",
          minSize: "proximity_50m_group_min_size",
        },
      },
      {
        text: "similarNameSameLevel110",
        priority: "Low",
        count: {
          kind: "check",
          section: "location",
          assertion: "duplicate_similar_name_same_level_within_110m_radius",
        },
      },
      {
        text: "highDensity",
        priority: "Low",
        count: {
          kind: "check",
          section: "location",
          assertion: "is_school_density_greater_than_5",
        },
      },
    ],
  },
];
