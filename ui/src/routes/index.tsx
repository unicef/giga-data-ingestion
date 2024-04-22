import { useEffect } from "react";

import { Stack } from "@carbon/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { uploadsQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import UploadLanding from "@/components/upload/UploadLanding.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";
import { validateSearchParams } from "@/utils/pagination.ts";

export const Route = createFileRoute("/")({
  component: Index,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(uploadsQueryOptions),
  validateSearch: validateSearchParams,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function Index() {
  const { page, page_size } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    uploadSliceActions: { resetUploadSliceState },
  } = useStore();

  useEffect(() => {
    return () => {
      resetUploadSliceState();
    };
  }, [resetUploadSliceState]);

  function handlePaginationChange({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) {
    void navigate({
      to: ".",
      search: () => ({
        page,
        page_size: pageSize,
      }),
    });
  }

  return (
    <AuthenticatedRBACView>
      <div className="container py-6">
        <Stack gap={6}>
          <UploadBreadcrumbs />
          <UploadLanding
            page={page}
            pageSize={page_size}
            handlePaginationChange={handlePaginationChange}
          />
        </Stack>
      </div>
    </AuthenticatedRBACView>
  );
}
