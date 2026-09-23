import { useMemo } from "react";

import { Stack, Tag } from "@carbon/react";

import { RegistryColumn } from "@/types/schemaRegistry.ts";

interface ChecksPanelProps {
  columns: RegistryColumn[];
}

interface CheckGroup {
  title: string;
  tagType: "magenta" | "purple" | "teal" | "cyan" | "red";
  columns: { column: RegistryColumn; detail: string }[];
}

function ChecksPanel({ columns }: ChecksPanelProps) {
  const groups = useMemo<CheckGroup[]>(() => {
    const mandatory: CheckGroup["columns"] = [];
    const unique: CheckGroup["columns"] = [];
    const domain: CheckGroup["columns"] = [];
    const range: CheckGroup["columns"] = [];
    const precision: CheckGroup["columns"] = [];

    for (const column of columns) {
      if (column.is_mandatory) {
        mandatory.push({
          column,
          detail: column.critical_for ? `critical: ${column.critical_for}` : "",
        });
      }
      if (column.is_unique) unique.push({ column, detail: "" });
      if (column.domain_values) {
        domain.push({ column, detail: column.domain_values });
      }
      if (
        column.range_min !== null ||
        column.range_max !== null ||
        column.dynamic_max
      ) {
        const min = column.range_min ?? "—";
        const max = column.dynamic_max ?? column.range_max ?? "—";
        range.push({ column, detail: `${min} – ${max}` });
      }
      if (column.precision_min !== null) {
        precision.push({
          column,
          detail: `min precision ${column.precision_min}`,
        });
      }
    }

    return [
      { title: "Mandatory", tagType: "magenta", columns: mandatory },
      { title: "Unique", tagType: "purple", columns: unique },
      { title: "Domain values", tagType: "teal", columns: domain },
      { title: "Range", tagType: "cyan", columns: range },
      { title: "Precision", tagType: "red", columns: precision },
    ];
  }, [columns]);

  const hasAnyChecks = groups.some(group => group.columns.length > 0);

  if (!hasAnyChecks) {
    return (
      <p className="text-giga-dark-gray">
        No data quality checks configured for this dataset.
      </p>
    );
  }

  return (
    <Stack gap={6}>
      {groups
        .filter(group => group.columns.length > 0)
        .map(group => (
          <div key={group.title}>
            <h5 className="mb-2 font-semibold">
              {group.title} ({group.columns.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {group.columns.map(({ column, detail }) => (
                <Tag key={column.name} type={group.tagType} title={detail}>
                  {column.name}
                  {detail ? ` — ${detail}` : ""}
                </Tag>
              ))}
            </div>
          </div>
        ))}
    </Stack>
  );
}

export default ChecksPanel;
