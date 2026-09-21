import { Heading, Section, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import {
  listSchemaDatasetsQueryOptions,
  listSchemaProposalsQueryOptions,
} from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import ProposalsTable from "@/components/schema-management/ProposalsTable.tsx";

export const Route = createFileRoute("/schema-management/proposals")({
  component: SchemaManagementProposals,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(listSchemaProposalsQueryOptions),
      queryClient.ensureQueryData(listSchemaDatasetsQueryOptions),
    ]),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementProposals() {
  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>Schema Change Proposals</Heading>
        </Section>
        <Section>
          <ProposalsTable />
        </Section>
      </Stack>
    </Section>
  );
}
