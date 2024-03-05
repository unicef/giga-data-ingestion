import { Heading, Section, Stack } from "@carbon/react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

import IngestTable from "@/components/ingest-api/IngestTable";

export const Route = createLazyFileRoute("/ingest-api/")({
  component: IngestApi,
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
