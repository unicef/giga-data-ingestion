import { Outlet } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Stack } from "@carbon/react";

export default function Layout() {
  return (
    <AuthenticatedTemplate>
      <Stack gap={4}>
        <Outlet />
      </Stack>
    </AuthenticatedTemplate>
  );
}
