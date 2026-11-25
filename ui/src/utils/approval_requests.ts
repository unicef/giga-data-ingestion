interface Item {
  info?: {
    header?: string;
  };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  value?: any;
}

export function getValueByHeader(array: Item[], header: string) {
  const item = array.find(obj => obj.info?.header === header);
  return item ? item.value : undefined;
}

export type ApprovalIdColumn = "facility_id_giga" | "school_id_giga";

/** Facility geolocation rows are keyed by facility_id_giga; legacy datasets by school_id_giga. */
export function getApprovalIdColumn(
  row: Record<string, unknown> | undefined,
): ApprovalIdColumn {
  return row && "facility_id_giga" in row
    ? "facility_id_giga"
    : "school_id_giga";
}
