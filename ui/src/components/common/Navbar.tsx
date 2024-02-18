import { AuthenticatedTemplate } from "@azure/msal-react";
import {
  Header,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
} from "@carbon/react";
import { Link } from "@tanstack/react-router";

import gigaLogoBlue from "@/assets/GIGA_logo_blue.png";
import { useStore } from "@/store.ts";

export default function Navbar() {
  const {
    user: { roles },
  } = useStore();
  const isPrivileged = roles.includes("Admin") || roles.includes("Super");

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
        {isPrivileged && (
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
            <HeaderMenuItem as={Link} to="/user-management">
              User management
            </HeaderMenuItem>
          </HeaderNavigation>
        )}
      </AuthenticatedTemplate>
    </Header>
  );
}
