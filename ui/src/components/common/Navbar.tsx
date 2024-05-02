import { AuthenticatedTemplate, useAccount } from "@azure/msal-react";
import { Logout } from "@carbon/icons-react";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
} from "@carbon/react";
import { useIsFetching } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import useLogout from "@/hooks/useLogout.ts";
import useRoles from "@/hooks/useRoles.ts";

import { HeaderName, HeaderNavigation } from "./CarbonOverrides";
import ProgressBar from "./ProgressBar";

export default function Navbar() {
  const logout = useLogout();
  const account = useAccount();
  const { isPrivileged, hasRoles } = useRoles();
  const { location } = useRouterState();
  const isFetching = useIsFetching();

  const isLoading = isFetching > 0;

  return (
    <Header
      aria-label="Main Header"
      aria-labelledby="main-header-label"
      className="relative py-0"
    >
      <ProgressBar isLoading={isLoading} />

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
            search={{
              page: DEFAULT_PAGE_NUMBER,
              page_size: DEFAULT_PAGE_SIZE,
            }}
            disabled={!hasRoles}
            isActive={
              location.pathname.startsWith("/upload") ||
              location.pathname === "/"
            }
          >
            File uploads
          </HeaderMenuItem>
          {isPrivileged && (
            <HeaderMenuItem
              as={Link}
              to="/delete"
              search={{
                page: DEFAULT_PAGE_NUMBER,
                page_size: DEFAULT_PAGE_SIZE,
              }}
              isActive={location.pathname.startsWith("/delete")}
            >
              Delete Rows
            </HeaderMenuItem>
          )}
          <HeaderMenuItem
            as={Link}
            to="/ingest-api"
            search={{
              page: DEFAULT_PAGE_NUMBER,
              page_size: DEFAULT_PAGE_SIZE,
            }}
            disabled={!hasRoles}
            isActive={location.pathname.startsWith("/ingest-api")}
          >
            Ingest API
          </HeaderMenuItem>
          {isPrivileged && (
            <HeaderMenuItem
              as={Link}
              to="/approval-requests"
              search={{
                page: DEFAULT_PAGE_NUMBER,
                page_size: DEFAULT_PAGE_SIZE,
              }}
              isActive={location.pathname.startsWith("/approval-requests")}
            >
              Approval requests
            </HeaderMenuItem>
          )}
          {isPrivileged && (
            <HeaderMenuItem
              as={Link}
              to="/user-management"
              search={{
                page: DEFAULT_PAGE_NUMBER,
                page_size: DEFAULT_PAGE_SIZE,
              }}
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
