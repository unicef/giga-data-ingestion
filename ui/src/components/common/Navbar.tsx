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
    <Header className="relative">
      <HeaderName as={Link} to="/" unstable_viewTransition prefix="">
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
      <HeaderGlobalBar>
        <HeaderGlobalAction
          onClick={() => setIsSwitcherExpanded(expanded => !expanded)}
        >
          <SwitcherIcon />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
      <HeaderPanel
        expanded={isSwitcherExpanded}
        onHeaderPanelFocus={() => setIsSwitcherExpanded(expanded => !expanded)}
      >
        <Switcher aria-label="switcher container" expanded={isSwitcherExpanded}>
          <SwitcherItem aria-label="upload file">
            <Link to="/upload" unstable_viewTransition>
              Upload File
            </Link>
          </SwitcherItem>
          <SwitcherItem aria-label="upload file">
            <Link to="/datasources" unstable_viewTransition>
              Ingest API
            </Link>
          </SwitcherItem>
          {featureFlags.userManagementPage && (
            <AuthenticatedTemplate>
              <SwitcherItem aria-label="upload file">
                <Link to="/user-management" unstable_viewTransition>
                  Admin Panel
                </Link>
              </SwitcherItem>
            </AuthenticatedTemplate>
          )}
        </Switcher>
      </HeaderPanel>
    </Header>
  );
}
