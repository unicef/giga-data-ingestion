import { Outlet } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

export default function Upload() {
  return (
    <AuthenticatedTemplate>
      <div className="container py-6">
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  );
}
