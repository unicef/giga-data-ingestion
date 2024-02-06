import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";

export const Route = createFileRoute("/upload")({
  component: () => (
    <AuthenticatedTemplate>
      <div className="container flex flex-col gap-4 py-6">
        <UploadBreadcrumbs />
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  ),
});
