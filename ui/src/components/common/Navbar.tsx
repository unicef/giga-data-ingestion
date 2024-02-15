import { ComponentProps, PropsWithChildren, ReactNode, useState } from "react";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Switcher as SwitcherIcon } from "@carbon/icons-react";
import {
  SwitcherItem as CarbonSwitcherItem,
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  HeaderPanel,
  Switcher,
} from "@carbon/react";
import { Link, LinkComponent, useRouterState } from "@tanstack/react-router";

import gigaLogoBlue from "@/assets/GIGA_logo_blue.png";
import { useStore } from "@/store.ts";

type SwitcherLinkItemProps = ComponentProps<typeof CarbonSwitcherItem> &
  PropsWithChildren & {
    as: ReactNode | LinkComponent;
    to: string;
  };

const SwitcherLinkItem = ({ children, ...props }: SwitcherLinkItemProps) => {
  return <CarbonSwitcherItem {...props}>{children}</CarbonSwitcherItem>;
};

export default function Navbar() {
  const { featureFlags } = useStore();
  const { location } = useRouterState();
  const [isSwitcherExpanded, setIsSwitcherExpanded] = useState(false);

  const isUserManagementPage = location.pathname === "/user-management";

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
        {featureFlags.userManagementPage && (
          <HeaderNavigation
            aria-label="Main Navigation"
            aria-labelledby="main-nav-label"
          >
            <HeaderMenuItem as={Link} to="/user-management">
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
          <SwitcherLinkItem aria-label="upload file" as={Link} to="/upload">
            Upload File
          </SwitcherLinkItem>
          <SwitcherLinkItem aria-label="upload file" as={Link} to="/ingest-api">
            Ingest API
          </SwitcherLinkItem>
          {featureFlags.userManagementPage && (
            <AuthenticatedTemplate>
              <SwitcherLinkItem
                aria-label="user management"
                as={Link}
                to={isUserManagementPage ? "/" : "/user-management"}
              >
                {isUserManagementPage ? "Ingestion Portal" : "Admin Panel"}
              </SwitcherLinkItem>
            </AuthenticatedTemplate>
          )}
        </Switcher>
      </HeaderPanel>
    </Header>
  );
}
