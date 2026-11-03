import { Outlet, createFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";

export const Route = createFileRoute("/schema-management")({
  component: SchemaManagement,
});

function SchemaManagement() {
  return (
    <AuthenticatedRBACView>
      <Outlet />
    </AuthenticatedRBACView>
  );
}
