import { Heading, Section, Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { listUsersQueryOptions } from "@/api/queryOptions.ts";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import UsersTable from "@/components/user-management/UsersTable.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import Forbidden from "@/components/utils/Forbidden";
import useRoles from "@/hooks/useRoles";
import { validateSearchParams } from "@/utils/pagination.ts";

export const Route = createFileRoute("/user-management")({
  component: UserManagement,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listUsersQueryOptions),
  validateSearch: validateSearchParams,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function UserManagement() {
  const { isAdmin } = useRoles();

  return (
    <AuthenticatedRBACView roles={["Admin", "Super"]}>
      {isAdmin ? (
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
      ) : (
        <Forbidden />
      )}
    </AuthenticatedRBACView>
  );
}
