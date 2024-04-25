import { Outlet, createFileRoute } from "@tanstack/react-router";

import { listUsersQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import { validateSearchParams } from "@/utils/pagination.ts";

export const Route = createFileRoute("/user-management/")({
  component: Outlet,
  validateSearch: validateSearchParams,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listUsersQueryOptions),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});
