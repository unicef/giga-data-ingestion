import { Heading, Section, Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { listApiIngestionsQueryOptions } from "@/api/queryOptions.ts";
import IngestTable from "@/components/ingest-api/IngestTable";

export const Route = createFileRoute("/ingest-api/")({
  component: IngestApi,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listApiIngestionsQueryOptions),
});

function IngestApi() {
  return (
    <Stack gap={4}>
      <Section className="container py-6">
        <Stack gap={6}>
          <Section>
            <Heading>Ingestions</Heading>
          </Section>
          <Section>
            <IngestTable />
          </Section>
        </Stack>
        <Outlet />
      </Section>
    </Stack>
  );
}
