import { createFileRoute } from "@tanstack/react-router";

import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import DatasetDetail from "@/components/schema-management/DatasetDetail.tsx";

export const Route = createFileRoute("/schema-management/$datasetKey")({
  component: SchemaManagementDatasetDetail,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(listDatasetGroupsQueryOptions),
      queryClient.ensureQueryData(listSchemaDatasetsQueryOptions),
    ]),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementDatasetDetail() {
  const { datasetKey } = Route.useParams();

  return <DatasetDetail datasetKey={datasetKey} />;
}
