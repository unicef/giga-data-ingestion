import { createFileRoute } from "@tanstack/react-router";

import { uploadsQueryOptions } from "@/api/queryOptions.ts";
import UploadLanding from "@/components/upload/UploadLanding.tsx";
import { PaginationSearchParams } from "@/types/pagination.ts";

export const Route = createFileRoute("/upload/")({
  component: UploadLanding,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(uploadsQueryOptions),
  validateSearch: (search: Record<string, unknown>): PaginationSearchParams =>
    PaginationSearchParams.parse(search),
});
