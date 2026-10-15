import { createFileRoute } from "@tanstack/react-router";

import { schemaGroupDetailQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import SchemaGroupDetail from "@/components/schema-management/SchemaGroupDetail.tsx";

export const Route = createFileRoute("/schema-management/groups/$groupKey")({
  component: SchemaGroupDetailRoute,
  loader: ({ params: { groupKey }, context: { queryClient } }) =>
    queryClient.ensureQueryData(schemaGroupDetailQueryOptions(groupKey)),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaGroupDetailRoute() {
  const { groupKey } = Route.useParams();
  return <SchemaGroupDetail groupKey={groupKey} />;
}
