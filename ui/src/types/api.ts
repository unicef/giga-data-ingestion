export interface PagedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total_count: number;
}
