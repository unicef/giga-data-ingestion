import { AuthenticatedTemplate, useAccount } from "@azure/msal-react";
import { Logout } from "@carbon/icons-react";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
} from "@carbon/react";
import { Link, useRouterState } from "@tanstack/react-router";

import useLogout from "@/hooks/useLogout.ts";
import useRoles from "@/hooks/useRoles.ts";

export default function Navbar() {
  const logout = useLogout();
  const account = useAccount();
  const { isPrivileged, hasRoles } = useRoles();
  const { location } = useRouterState();

  return (
    <Header
      aria-label="Main Header"
      aria-labelledby="main-header-label"
      className="relative"
    >
      <HeaderName as={Link} to="/" prefix="">
        <span className="font-light">giga</span>
        <b>sync</b>
      </HeaderName>
      <AuthenticatedTemplate>
        <HeaderNavigation
          aria-label="Main Navigation"
          aria-labelledby="main-nav-label"
        >
          <HeaderMenuItem
            as={Link}
            to="/upload"
            disabled={!hasRoles}
            isActive={
              location.pathname.startsWith("/upload") ||
              location.pathname === "/"
            }
          >
            File uploads
          </HeaderMenuItem>
          <HeaderMenuItem
            as={Link}
            to="/ingest-api"
            disabled={!hasRoles}
            isActive={location.pathname.startsWith("/ingest-api")}
          >
            Ingest API
          </HeaderMenuItem>
          {isPrivileged && (
            <HeaderMenuItem
              as={Link}
              to="/approval-requests"
              isActive={location.pathname.startsWith("/approval-requests")}
            >
              Approval requests
            </HeaderMenuItem>
          )}
          {isPrivileged && (
            <HeaderMenuItem
              as={Link}
              to="/user-management"
              isActive={location.pathname.startsWith("/user-management")}
            >
              User management
            </HeaderMenuItem>
          )}
        </HeaderNavigation>
        <HeaderGlobalBar className="flex items-center">
          <div className="text-sm text-giga-dark-gray">
            {(account?.idTokenClaims?.email as string) ?? ""}
          </div>
          <HeaderGlobalAction aria-label="Logout" onClick={logout}>
            <Logout />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </AuthenticatedTemplate>
    </Header>
  );
}
