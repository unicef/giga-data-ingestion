import { Heading, Section, Stack } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";

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
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <Link className="cds--link" to="/schema-management">
              Schema groups
            </Link>
            <span>/</span>
            <span className="text-giga-dark-gray">Audit log</span>
          </div>
          <Heading>Schema Registry Audit Log</Heading>
        </Section>
        <Section>
          <AuditLogTable />
        </Section>
      </Stack>
    </Section>
  );
}
