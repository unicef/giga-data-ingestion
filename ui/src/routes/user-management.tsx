import { useIsAuthenticated } from "@azure/msal-react";
import { Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import Login from "@/components/landing/Login";

export const Route = createFileRoute("/user-management")({
  component: UserManagementLayout,
});

function UserManagementLayout() {
  const isAuthenticated = useIsAuthenticated();

  return isAuthenticated ? (
    <Stack gap={4}>
      <Outlet />
    </Stack>
  ) : (
    <Login />
  );
}
