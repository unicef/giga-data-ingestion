export type DeleteIdType = "school_id_giga" | "school_id_govt";
export type DeleteType = "specific" | "all";

export interface DeleteRowsResponse {
  filename: string;
}

export const initialDeleteRowsResponse: DeleteRowsResponse = {
  filename: "",
};

export interface PreviewDeleteRowsResponse {
  school_count: number | null;
  check_skipped: boolean;
}

export interface DeletionRequest {
  id: string;
  requested_by_id: string;
  requested_by_email: string;
  requested_date: string;
  country: string;
  original_filename: string | null;
  id_type: DeleteIdType | null;
  school_count: number | null;
  file_path: string | null;
  is_delete_all: boolean | null;
  status: string | null;
}
