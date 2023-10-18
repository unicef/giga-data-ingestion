import { Outlet } from "react-router-dom";

import GroupBreadcrumbs from "@/components/user-management/GroupBreadcrumbs.tsx";

export default function Layout() {
  return (
    <>
      <GroupBreadcrumbs />
      <Outlet />
    </>
  );
}
