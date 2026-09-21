import { createFileRoute } from "@tanstack/react-router";

import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import DatasetDetail from "@/components/schema-management/DatasetDetail.tsx";

export const Route = createFileRoute("/schema-management/$datasetKey")({
  component: SchemaManagementDatasetDetail,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementDatasetDetail() {
  const { datasetKey } = Route.useParams();

  return <DatasetDetail datasetKey={datasetKey} />;
}
