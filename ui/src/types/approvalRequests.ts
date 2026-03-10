export interface ApprovalRequestListing {
  id: string;
  country: string;
  country_iso3: string;
  dataset: string;
  subpath: string;
  last_modified: string;
  rows_count: number;
  rows_added: number;
  rows_updated: number;
  rows_deleted: number;
  enabled: boolean;
}

export interface ApprovalRequestInfo {
  country: string;
  dataset: string;
  version: number;
  timestamp: string;
}

export type ChangeType =
  | "insert"
  | "delete"
  | "update_preimage"
  | "update_postimage";

export type ApprovalRequestData = Record<string, null> & {
  _change_type: ChangeType;
};

export type ApprovalRequest = {
  info: ApprovalRequestInfo;
  total_count: number;
  data: ApprovalRequestData[];
};

export const SENTINEL_APPROVAL_REQUEST: ApprovalRequest = {
  info: {
    country: "",
    dataset: "",
    version: 0,
    timestamp: "",
  },
  data: [],
  total_count: 0,
};

// Upload approved rows request
export interface UploadApiItem {
  upload_id: string;
  created: string;
  dataset: string;
  file_name: string;
  uploader_email: string;
}

// Backend response
export interface UploadByCountryResponse {
  items: UploadApiItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Frontend normalized row
export interface UploadRow {
  upload_id: string;
  uploaded_at: string;
  uploaded_by: string;
  dataset: string;
  file_name: string;
}

// Query state
export interface UploadQuery {
  country: string;
  dataset: string;

  page: number;
  page_size: number;

  upload_id?: string;
  uploaded_by?: string;

  sort_by?: "created" | "uploader_email";
  sort_order?: "asc" | "desc";
}
