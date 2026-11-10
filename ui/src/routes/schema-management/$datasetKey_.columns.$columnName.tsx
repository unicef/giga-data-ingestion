import { createFileRoute } from "@tanstack/react-router";

import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import ColumnDetail from "@/components/schema-management/ColumnDetail.tsx";

export const Route = createFileRoute(
  "/schema-management/$datasetKey/columns/$columnName",
)({
  component: SchemaManagementColumnDetail,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(listDatasetGroupsQueryOptions),
      queryClient.ensureQueryData(listSchemaDatasetsQueryOptions),
    ]),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementColumnDetail() {
  const { datasetKey, columnName } = Route.useParams();

  return <ColumnDetail datasetKey={datasetKey} columnName={columnName} />;
}
