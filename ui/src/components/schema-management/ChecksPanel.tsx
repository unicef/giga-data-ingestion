import { useMemo } from "react";

import { Button, Stack, Tag } from "@carbon/react";
import { useNavigate } from "@tanstack/react-router";

import { formatDomainOrRange } from "@/components/schema-management/columnDisplay.ts";
import { RegistryColumn } from "@/types/schemaRegistry.ts";

interface ChecksPanelProps {
  datasetKey: string;
  columns: RegistryColumn[];
  onEditColumn?: (columnName: string) => void;
}

interface CheckGroup {
  title: string;
  tagType: "magenta" | "purple" | "teal" | "cyan" | "red";
  columns: { column: RegistryColumn; detail: string }[];
}

function ChecksPanel({ datasetKey, columns, onEditColumn }: ChecksPanelProps) {
  const navigate = useNavigate();
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
          detail: column.critical_for
            ? `critical for ${column.critical_for}`
            : "mandatory enabled",
        });
      }
      if (column.is_unique) {
        unique.push({ column, detail: "unique enabled" });
      }
      if (column.domain_values) {
        domain.push({
          column,
          detail: column.domain_values.split("|").join(" | "),
        });
      }
      if (
        column.range_min !== null ||
        column.range_max !== null ||
        column.dynamic_max
      ) {
        range.push({ column, detail: formatDomainOrRange(column) });
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

  const columnsWithChecks = useMemo(
    () =>
      columns.filter(
        column =>
          column.is_mandatory ||
          column.is_unique ||
          column.domain_values ||
          column.range_min !== null ||
          column.range_max !== null ||
          column.dynamic_max ||
          column.precision_min !== null,
      ).length,
    [columns],
  );

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
      <p className="text-sm text-giga-dark-gray">
        {columnsWithChecks} column
        {columnsWithChecks === 1 ? "" : "s"} with checks
      </p>
      {groups
        .filter(group => group.columns.length > 0)
        .map(group => (
          <div key={group.title}>
            <h5 className="mb-3 font-semibold">
              {group.title} ({group.columns.length})
            </h5>
            <div className="border border-carbon-datatable-grey bg-white">
              {group.columns.map(({ column, detail }) => (
                <div
                  key={`${group.title}-${column.name}`}
                  role="link"
                  tabIndex={0}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 border-b border-carbon-datatable-grey px-4 py-3 last:border-b-0 hover:bg-giga-light-blue"
                  onClick={() =>
                    void navigate({
                      to: "/schema-management/$datasetKey/columns/$columnName",
                      params: { datasetKey, columnName: column.name },
                    })
                  }
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void navigate({
                        to: "/schema-management/$datasetKey/columns/$columnName",
                        params: { datasetKey, columnName: column.name },
                      });
                    }
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{column.name}</span>
                      <Tag type={group.tagType}>{group.title}</Tag>
                    </div>
                    <p className="mt-1 text-sm text-giga-dark-gray">{detail}</p>
                  </div>
                  {onEditColumn && (
                    <Button
                      kind="tertiary"
                      size="sm"
                      onClick={event => {
                        event.stopPropagation();
                        onEditColumn(column.name);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </Stack>
  );
}

export default ChecksPanel;
