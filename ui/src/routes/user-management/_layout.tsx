import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user-management/_layout")({
  component: () => (
    <AuthenticatedTemplate>
      <div className="flex w-full flex-col gap-4 p-6">
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  ),
});
