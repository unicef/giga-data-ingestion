import { Heading, Section, Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import UsersTable from "@/components/user-management/UsersTable.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";

export const Route = createLazyFileRoute("/user-management")({
  component: UserManagement,
});

function UserManagement() {
  return (
    <AuthenticatedRBACView roles={["Admin", "Super"]}>
      <Stack gap={4}>
        <Section className="container py-6">
          <Stack gap={6}>
            <Section>
              <Heading>User Management</Heading>
            </Section>
            <Section>
              <UsersTable />
            </Section>
          </Stack>

          <Outlet />
        </Section>
      </Stack>
    </AuthenticatedRBACView>
  );
}
