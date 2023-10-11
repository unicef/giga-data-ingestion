import { Outlet } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

export default function Layout() {
  return (
    <AuthenticatedTemplate>
      <Outlet />
    </AuthenticatedTemplate>
  );
}
