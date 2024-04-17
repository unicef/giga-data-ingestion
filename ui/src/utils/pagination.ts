import { PaginationSearchParams } from "@/types/pagination.ts";

export function validateSearchParams(
  search: Record<string, unknown>,
): PaginationSearchParams {
  return PaginationSearchParams.parse(search);
}
