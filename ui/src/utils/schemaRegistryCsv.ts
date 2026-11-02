import { saveAs } from "file-saver";

import { RegistryColumn } from "@/types/schemaRegistry.ts";

// Keep in sync with REGISTRY_COLUMN_FIELDS in api/data_ingestion/internal/schema_registry.py
// so an exported CSV can be re-imported as-is.
const CSV_FIELDS: (keyof RegistryColumn)[] = [
  "name",
  "data_type",
  "is_nullable",
  "is_important",
  "is_system_generated",
  "description",
  "primary_key",
  "partition_order",
  "license",
  "units",
  "hint",
  "is_mandatory",
  "is_unique",
  "domain_values",
  "range_min",
  "range_max",
  "dynamic_max",
  "precision_min",
  "critical_for",
];

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function columnsToCsv(columns: RegistryColumn[]): string {
  const lines = [
    CSV_FIELDS.join(","),
    ...columns.map(column =>
      CSV_FIELDS.map(field => escapeCsvValue(column[field])).join(","),
    ),
  ];
  return lines.join("\r\n");
}

export function downloadColumnsCsv(
  datasetKey: string,
  columns: RegistryColumn[],
) {
  const csv = columnsToCsv(columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${datasetKey}_schema.csv`);
}
