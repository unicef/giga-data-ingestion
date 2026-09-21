import { Section, Stack } from "@carbon/react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";

export const Route = createFileRoute("/schema-management")({
  component: SchemaManagement,
});

function SchemaManagement() {
  return (
    <AuthenticatedRBACView>
      <Stack gap={4}>
        <Section className="container pt-6">
          <Link to="/schema-management">Schema Management</Link>
        </Section>
        <Outlet />
      </Stack>
    </AuthenticatedRBACView>
  );
}
