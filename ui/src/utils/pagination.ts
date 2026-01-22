import { z } from "zod";

import { PaginationSearchParams } from "@/types/pagination.ts";

const ExtendedPaginationSearchParams = PaginationSearchParams.extend({
  country: z.string().optional(),
  dataset: z.string().optional(),

  upload_id: z.string().optional(),
  uploaded_by: z.string().optional(),

  sort_by: z.enum(["created", "uploader_email"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),

  upload_ids: z.string().optional(),
  subpath: z.string().optional(),
});

export function validateSearchParams(search: Record<string, unknown>) {
  return ExtendedPaginationSearchParams.parse(search);
}
