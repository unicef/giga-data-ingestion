import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { uploadsQueryOptions } from "@/api/queryOptions.ts";
import UploadLanding from "@/components/upload/UploadLanding.tsx";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

const SearchParams = z.object({
  page: z.number().int().gt(0).catch(DEFAULT_PAGE_NUMBER),
  page_size: z.number().int().gt(0).catch(DEFAULT_PAGE_SIZE),
});

type SearchParams = z.infer<typeof SearchParams>;

export const Route = createFileRoute("/upload/")({
  component: UploadLanding,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(uploadsQueryOptions),
  validateSearch: (search): SearchParams => SearchParams.parse(search),
});
