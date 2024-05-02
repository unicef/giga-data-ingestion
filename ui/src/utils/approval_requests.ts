import { ChangeType } from "@/types/approvalRequests.ts";

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

interface CDFSelector {
  school_id_giga: string;
  _change_type: ChangeType;
  _commit_version: number;
  _commit_timestamp: string;
}

export function computeChangeId({
  school_id_giga,
  _change_type,
  _commit_version,
  _commit_timestamp,
}: CDFSelector) {
  return `${school_id_giga}|${_change_type}|${_commit_version}|${_commit_timestamp}`;
}
