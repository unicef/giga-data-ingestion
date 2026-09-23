import { Heading, Section, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import AuditLogTable from "@/components/schema-management/AuditLogTable.tsx";

export const Route = createFileRoute("/schema-management/audit")({
  component: SchemaManagementAudit,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function SchemaManagementAudit() {
  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>Schema Registry Audit Log</Heading>
        </Section>
        <Section>
          <AuditLogTable />
        </Section>
      </Stack>
    </Section>
  );
}
