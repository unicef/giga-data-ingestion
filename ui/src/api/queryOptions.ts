import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/index.ts";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

export const uploadsQueryOptions = queryOptions({
  queryFn: () =>
    api.uploads.list_uploads({
      page: DEFAULT_PAGE_NUMBER,
      page_size: DEFAULT_PAGE_SIZE,
    }),
  queryKey: ["uploads", DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE],
});
