import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";

export const Route = createLazyFileRoute("/approval-requests")({
  component: ApprovalRequestsLayout,
});

function ApprovalRequestsLayout() {
  return (
    <AuthenticatedRBACView>
      <Outlet />
    </AuthenticatedRBACView>
  );
}
