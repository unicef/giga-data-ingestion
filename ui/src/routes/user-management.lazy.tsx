import { useIsAuthenticated } from "@azure/msal-react";
import { Heading, Section, Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import Login from "@/components/landing/Login";
import UsersTable from "@/components/user-management/UsersTable.tsx";

export const Route = createLazyFileRoute("/user-management")({
  component: UserManagement,
});

function UserManagement() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) return <Login />;

  return (
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
  );
}
