import { AuthenticatedTemplate } from "@azure/msal-react";
import { Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user-management")({
  component: () => (
    <AuthenticatedTemplate>
      <Stack gap={4}>
        <Outlet />
      </Stack>
    </AuthenticatedTemplate>
  ),
});
