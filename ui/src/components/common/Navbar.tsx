import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Switcher as SwitcherIcon } from "@carbon/icons-react";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  HeaderPanel,
  Switcher,
  SwitcherItem,
} from "@carbon/react";

import { useStore } from "@/store.ts";

export default function Navbar() {
  const { featureFlags } = useStore();
  const [isSwitcherExpanded, setIsSwitcherExpanded] = useState(false);

  return (
    <Header
      aria-label="Main Header"
      aria-labelledby="main-header-label"
      className="relative"
    >
      <HeaderName as={Link} to="/" unstable_viewTransition prefix="">
        <img src="/GIGA_logo_blue.png" className="h-5/6" alt="Giga" />
        <span className="ml-1 text-xl font-light">giga</span>
        <b className="ml-0.5 text-xl">sync</b>
      </HeaderName>
      <AuthenticatedTemplate>
        {featureFlags.userManagementPage && (
          <HeaderNavigation
            aria-label="Main Navigation"
            aria-labelledby="main-nav-label"
          >
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
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label="Switcher"
          aria-labelledby="switcher-label"
          onClick={() => {
            setIsSwitcherExpanded(expanded => !expanded);
          }}
        >
          <SwitcherIcon />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
      <HeaderPanel
        expanded={isSwitcherExpanded}
        onHeaderPanelFocus={() => setIsSwitcherExpanded(expanded => !expanded)}
      >
        <Switcher aria-label="switcher container" expanded={isSwitcherExpanded}>
          <SwitcherItem
            aria-label="upload file"
            as={Link}
            to="/upload"
            unstable_viewTransition
          >
            Upload File
          </SwitcherItem>
          <SwitcherItem
            aria-label="upload file"
            as={Link}
            to="/datasources"
            unstable_viewTransition
          >
            Ingest API
          </SwitcherItem>
          {featureFlags.userManagementPage && (
            <AuthenticatedTemplate>
              <SwitcherItem
                aria-label="upload file"
                as={Link}
                to="user-management"
                unstable_viewTransition
              >
                Admin Panel
              </SwitcherItem>
            </AuthenticatedTemplate>
          )}
        </Switcher>
      </HeaderPanel>
    </Header>
  );
}
