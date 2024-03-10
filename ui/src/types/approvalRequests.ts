export interface ApprovalRequestListing {
  country: string;
  country_iso3: string;
  dataset: string;
  subpath: string;
  last_modified: string;
  rows_added: number;
  rows_updated: number;
  rows_deleted: number;
}

export type ApprovalRequest = Record<string, string | number | null> & {
  _change_data: "insert" | "remove" | "update_preimage";
};
