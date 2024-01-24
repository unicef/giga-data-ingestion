import { Link } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";
import {
  Header,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
} from "@carbon/react";

import { useStore } from "@/store.ts";

export default function Navbar() {
  const { featureFlags } = useStore();

  return (
    <Header className="relative">
      <HeaderName href="/" prefix="">
        <img src="/GIGA_logo_blue.png" className="h-5/6" alt="Giga" />
        <b>giga</b>ingest
      </HeaderName>
      <AuthenticatedTemplate>
        {featureFlags.userManagementPage && (
          <HeaderNavigation>
            <HeaderMenuItem
              as={Link}
              to="/user-management"
              unstable_viewTransition
            >
              Admin Panel
            </HeaderMenuItem>
          </HeaderNavigation>
        )}
      </AuthenticatedTemplate>
    </Header>
  );
}
