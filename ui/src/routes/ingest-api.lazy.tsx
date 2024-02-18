import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";

export const Route = createLazyFileRoute("/ingest-api")({
  component: IngestApiLayout,
});

function IngestApiLayout() {
  return (
    <AuthenticatedRBACView>
      <Outlet />
    </AuthenticatedRBACView>
  );
}
