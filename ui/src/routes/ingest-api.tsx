import { useIsAuthenticated } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import Login from "@/components/landing/Login";

export const Route = createFileRoute("/ingest-api")({
  component: IngestApiLayout,
});

function IngestApiLayout() {
  const isAuthenticated = useIsAuthenticated();

  return isAuthenticated ? <Outlet /> : <Login />;
}
