import { Outlet } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";

export default function Upload() {
  return (
    <AuthenticatedTemplate>
      <div className="container flex flex-col gap-4 py-6">
        <UploadBreadcrumbs />
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  );
}
