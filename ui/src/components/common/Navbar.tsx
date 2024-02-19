import { useMemo } from "react";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Logout } from "@carbon/icons-react";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
} from "@carbon/react";
import { Link } from "@tanstack/react-router";

import gigaLogoBlue from "@/assets/GIGA_logo_blue.png";
import useLogout from "@/hooks/useLogout.ts";
import { useStore } from "@/store.ts";

export default function Navbar() {
  const {
    user: { roles },
  } = useStore();
  const logout = useLogout();

  const isPrivileged = useMemo(
    () => roles.includes("Admin") || roles.includes("Super"),
    [roles],
  );

  return (
    <Header
      aria-label="Main Header"
      aria-labelledby="main-header-label"
      className="relative"
    >
      <HeaderName as={Link} to="/" prefix="">
        <img src={gigaLogoBlue} className="h-5/6" alt="Giga" />
        <span className="ml-1 text-xl font-light">giga</span>
        <b className="ml-0.5 text-xl">sync</b>
      </HeaderName>
      <AuthenticatedTemplate>
        <HeaderNavigation
          aria-label="Main Navigation"
          aria-labelledby="main-nav-label"
        >
          <HeaderMenuItem as={Link} to="/upload">
            Upload file
          </HeaderMenuItem>
          <HeaderMenuItem as={Link} to="/ingest-api">
            Ingest API
          </HeaderMenuItem>
          {isPrivileged && (
            <HeaderMenuItem as={Link} to="/user-management">
              User management
            </HeaderMenuItem>
          )}
        </HeaderNavigation>
        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label="Logout" onClick={logout}>
            <Logout />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </AuthenticatedTemplate>
    </Header>
  );
}
