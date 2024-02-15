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
import { Link } from "@tanstack/react-router";

import useLogout from "@/hooks/useLogout.ts";
import useRoles from "@/hooks/useRoles.ts";

export default function Navbar() {
  const logout = useLogout();
  const account = useAccount();
  const { isPrivileged, hasRoles } = useRoles();

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
          <HeaderMenuItem as={Link} to="/upload" disabled={!hasRoles}>
            File uploads
          </HeaderMenuItem>
          <HeaderMenuItem as={Link} to="/ingest-api" disabled={!hasRoles}>
            Ingest API
          </HeaderMenuItem>
          {isPrivileged && (
            <HeaderMenuItem as={Link} to="/user-management">
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
