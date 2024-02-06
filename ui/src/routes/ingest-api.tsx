import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ingest-api")({
  component: () => (
    <AuthenticatedTemplate>
      <Outlet />
    </AuthenticatedTemplate>
  ),
});
