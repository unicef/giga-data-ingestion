import { Link, useLocation } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Button } from "@carbon/react";
import clsx from "clsx";

import { useStore } from "@/store.ts";

export default function Navbar() {
  const { featureFlags } = useStore();
  const location = useLocation();

  const isUserManagementPage = location.pathname === "/user-management";

  const linkClass = clsx("flex items-center gap-2", {
    "text-primary": isUserManagementPage,
    "text-white": !isUserManagementPage,
  });

  const headerClass = clsx("text-2xl", {
    "text-primary": isUserManagementPage,
    "text-white": !isUserManagementPage,
  });

  return (
    <header className="flex-none">
      <nav
        className={clsx("flex h-[80px] items-center justify-between p-4", {
          "border-b-4 border-solid border-primary": isUserManagementPage,
          "bg-primary": !isUserManagementPage,
        })}
      >
        <Link to="/" className={linkClass} unstable_viewTransition>
          <img
            src={
              isUserManagementPage ? "/GIGA_logo_blue.png" : "/GIGA_logo.png"
            }
            alt="Giga"
          />
          <h1 className={headerClass}>giga ingest</h1>
        </Link>

        <AuthenticatedTemplate>
          {featureFlags.userManagementPage && (
            <Button
              as={Link}
              to={isUserManagementPage ? "/" : "/user-management"}
              unstable_viewTransition
              kind={isUserManagementPage ? "ghost" : "secondary"}
            >
              {isUserManagementPage ? "Ingestion Portal" : "Admin Panel"}
            </Button>
          )}
        </AuthenticatedTemplate>
      </nav>
    </header>
  );
}
