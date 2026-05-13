export interface CountryPendingListing {
  country: string;
  country_iso3: string;
  pending_uploads: number;
  rows_added: number;
  rows_updated: number;
  rows_deleted: number;
}

export interface UploadListing {
  upload_id: string;
  dataset: string;
  uploaded_at: string;
  uploader_email: string;
  rows_added: number;
  rows_updated: number;
  rows_deleted: number;
  rows_unchanged: number;
  is_merge_processing: boolean;
}

export interface ApprovalRequestInfo {
  country: string;
  country_iso3: string;
  dataset: string;
  upload_id: string;
  uploaded_at: string;
  uploader_email: string;
}

export type ChangeType = "INSERT" | "UPDATE" | "DELETE";

export type ApprovalRequestData = Record<string, unknown> & {
  school_id_giga: string;
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
    country_iso3: "",
    dataset: "",
    upload_id: "",
    uploaded_at: "",
    uploader_email: "",
  },
  data: [],
  total_count: 0,
};
