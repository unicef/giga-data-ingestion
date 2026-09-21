import { Heading, Section, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import DatasetsTable from "@/components/schema-management/DatasetsTable.tsx";

export const Route = createFileRoute("/schema-management/")({
  component: SchemaManagementIndex,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(listSchemaDatasetsQueryOptions),
      queryClient.ensureQueryData(listDatasetGroupsQueryOptions),
    ]),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementIndex() {
  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>Datasets</Heading>
        </Section>
        <Section>
          <DatasetsTable />
        </Section>
      </Stack>
    </Section>
  );
}
