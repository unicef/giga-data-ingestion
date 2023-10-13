import { Link, Outlet, useLocation } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Menu } from "antd";

export default function Layout() {
  const { pathname } = useLocation();
  const page = pathname.split("/").at(2) ?? "";

  return (
    <AuthenticatedTemplate>
      <div className="flex gap-4 py-6">
        <Menu mode="inline" className="w-72 flex-auto" selectedKeys={[page]}>
          <Menu.Item key="users">
            <Link to="users">Users</Link>
          </Menu.Item>
          <Menu.Item key="roles">
            <Link to="roles">Roles</Link>
          </Menu.Item>
        </Menu>

        <div className="flex w-full flex-col gap-4 px-6">
          <Outlet />
        </div>
      </div>
    </AuthenticatedTemplate>
  );
}
