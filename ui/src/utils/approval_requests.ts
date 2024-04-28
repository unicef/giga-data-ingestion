import { CDFSelector } from "@/context/slices/approveRowSlice.ts";

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

export function cdfRowStringHash(row: Record<string, string | null>) {
  return `${row.school_id_giga}|${row._commit_version}|${row._change_type}`;
}

export function cdfComponentStringHash({
  school_id_giga,
  _change_type,
  _commit_version,
}: CDFSelector) {
  return `${school_id_giga}|${_commit_version}|${_change_type}`;
}
