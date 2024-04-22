import { z } from "zod";

import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

export const PaginationSearchParams = z.object({
  page: z.number().int().gt(0).optional().catch(DEFAULT_PAGE_NUMBER),
  page_size: z.number().int().gt(0).optional().catch(DEFAULT_PAGE_SIZE),
});

export type PaginationSearchParams = z.infer<typeof PaginationSearchParams>;
