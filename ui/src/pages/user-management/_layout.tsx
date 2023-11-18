import { Outlet } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

export default function Layout() {
  return (
    <AuthenticatedTemplate>
      <div className="flex w-full flex-col gap-4 p-6">
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  );
}
