export interface PagedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total_count: number;
}

export const SENTINEL_PAGED_RESPONSE = {
  data: [],
  page: 0,
  page_size: 0,
  total_count: 0,
};

export interface PaginationRequest {
  page?: number;
  page_size?: number;
}
