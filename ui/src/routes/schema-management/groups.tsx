import { Heading, Section, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import { listDatasetGroupsQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import GroupsManager from "@/components/schema-management/GroupsManager.tsx";

export const Route = createFileRoute("/schema-management/groups")({
  component: SchemaManagementGroups,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listDatasetGroupsQueryOptions),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementGroups() {
  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>Dataset Groups</Heading>
        </Section>
        <Section>
          <GroupsManager />
        </Section>
      </Stack>
    </Section>
  );
}
