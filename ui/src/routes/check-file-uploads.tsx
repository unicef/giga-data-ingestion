import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import CheckFileUploadsBreadCrumbs from "@/components/upload/CheckFileUploadsBreadCrumbs";

export const Route = createFileRoute("/check-file-uploads")({
  component: UploadLayout,
});

function UploadLayout() {
  return (
    <AuthenticatedTemplate>
      <div className="container flex flex-col gap-4 py-6">
        <CheckFileUploadsBreadCrumbs />
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  );
}
