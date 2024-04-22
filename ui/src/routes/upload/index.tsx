import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { uploadsQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import UploadLanding from "@/components/upload/UploadLanding.tsx";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { validateSearchParams } from "@/utils/pagination.ts";

export const Route = createFileRoute("/upload/")({
  component: Index,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(uploadsQueryOptions),
  validateSearch: validateSearchParams,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function Index() {
  const { page = DEFAULT_PAGE_NUMBER, page_size = DEFAULT_PAGE_SIZE } =
    Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  function handlePaginationChange({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) {
    void navigate({ to: ".", search: () => ({ page, page_size: pageSize }) });
  }

  return (
    <UploadLanding
      handlePaginationChange={handlePaginationChange}
      page={page}
      pageSize={page_size}
    />
  );
}
