import { Section } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import Forbidden from "@/components/utils/Forbidden";
import useRoles from "@/hooks/useRoles";

export const Route = createLazyFileRoute("/approval-requests")({
  component: ApprovalRequestsLayout,
});

function ApprovalRequestsLayout() {
  const { isAdmin } = useRoles();

  return (
    <AuthenticatedRBACView>
      {isAdmin ? (
        <Section className="container flex flex-col gap-4 py-6">
          <Outlet />
        </Section>
      ) : (
        <Forbidden />
      )}
    </AuthenticatedRBACView>
  );
}
