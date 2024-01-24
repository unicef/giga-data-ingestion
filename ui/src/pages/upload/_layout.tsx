import { Outlet } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";

export default function Upload() {
  return (
    <AuthenticatedTemplate>
      <div className="m-0 flex w-full flex-col gap-4 py-6">
        <div className="px-28">
          <UploadBreadcrumbs />
          <Outlet />
        </div>
      </div>
    </AuthenticatedTemplate>
  );
}
