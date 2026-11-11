import {
  ColumnSource,
  RegistryColumn,
  ResolvedRegistryColumn,
} from "@/types/schemaRegistry.ts";

const NUMERIC_DATA_TYPES = new Set(["integer", "long", "float", "double"]);

const SOURCE_LABELS: Record<ColumnSource, string> = {
  government: "Government",
  system_generated: "System Generated",
};

export function resolveColumnSource(
  column: Pick<RegistryColumn, "source" | "is_system_generated">,
): ColumnSource | null {
  if (column.source === "government" || column.source === "system_generated") {
    return column.source;
  }
  // Older snapshots may only have the boolean flag.
  if (column.is_system_generated) return "system_generated";
  return null;
}

export function formatColumnSource(
  column: Pick<RegistryColumn, "source" | "is_system_generated">,
): string {
  const source = resolveColumnSource(column);
  return source ? SOURCE_LABELS[source] : "";
}

export function isNumericDataType(dataType: string | null | undefined) {
  return NUMERIC_DATA_TYPES.has((dataType ?? "").toLowerCase());
}

export function parseDomainValues(domainValues: string | null | undefined) {
  if (!domainValues) return [];
  return domainValues
    .split("|")
    .map(value => value.trim())
    .filter(Boolean);
}

export function formatDomainOrRange(column: RegistryColumn): string {
  const domain = parseDomainValues(column.domain_values);
  if (domain.length > 0) return domain.join(" | ");

  if (
    column.range_min !== null ||
    column.range_max !== null ||
    column.dynamic_max
  ) {
    const min = column.range_min ?? "—";
    const max = column.dynamic_max ?? column.range_max ?? "—";
    return `${min} → ${max}`;
  }

  return "";
}

export function countConfiguredChecks(column: RegistryColumn): number {
  let count = 0;
  if (column.is_mandatory) count += 1;
  if (column.is_unique) count += 1;
  if (parseDomainValues(column.domain_values).length > 0) count += 1;
  if (
    column.range_min !== null ||
    column.range_max !== null ||
    column.dynamic_max
  ) {
    count += 1;
  }
  if (column.precision_min !== null) count += 1;
  return count;
}

export function isOwnedColumn(
  column: RegistryColumn | ResolvedRegistryColumn,
  datasetKey: string,
) {
  if ("origin" in column) {
    return column.origin === "member" && column.owner_schema_key === datasetKey;
  }
  return true;
}

export function sortColumnsForDisplay<
  Column extends RegistryColumn | ResolvedRegistryColumn,
>(columns: Column[]): Column[] {
  const priority = (column: Column) => {
    if (column.primary_key) return 0;
    if (column.is_mandatory || column.is_nullable === false) return 1;
    if (column.is_important) return 2;
    return 3;
  };

  return [...columns].sort(
    (left, right) =>
      priority(left) - priority(right) ||
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}
