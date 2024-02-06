import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ingest-api/_layout")({
  component: () => (
    <AuthenticatedTemplate>
      <Outlet />
    </AuthenticatedTemplate>
  ),
});
