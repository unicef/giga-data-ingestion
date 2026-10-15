import { Heading, Section, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import GroupsManager from "@/components/schema-management/GroupsManager.tsx";

export const Route = createFileRoute("/schema-management/groups/")({
  component: SchemaGroupAdministration,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(listDatasetGroupsQueryOptions),
      queryClient.ensureQueryData(listSchemaDatasetsQueryOptions),
    ]),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaGroupAdministration() {
  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>Schema group administration</Heading>
          <p className="mt-2 text-giga-dark-gray">
            Create groups and manage exceptional schema placement changes.
          </p>
        </Section>
        <Section>
          <GroupsManager />
        </Section>
      </Stack>
    </Section>
  );
}
