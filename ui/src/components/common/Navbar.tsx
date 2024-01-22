import { Link, useLocation } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";
import clsx from "clsx";

import { useStore } from "@/store.ts";

export default function Navbar() {
  const { featureFlags } = useStore();
  const location = useLocation();

  const isUserManagementPage = location.pathname === "/user-management";

  const navClass = clsx("flex h-[80px] items-center justify-between", {
    "border-b-4 border-primary bg-white p-4 ": isUserManagementPage,
    " bg-primary p-4 text-white": !isUserManagementPage,
  });

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
      <nav className={navClass}>
        <Link to="/" className={linkClass} unstable_viewTransition>
          <img
            src={
              isUserManagementPage ? "/GIGA_logo_blue.png" : "/GIGA_logo.png"
            }
            alt="Giga"
          />
          <h1 className={headerClass}>
            <b>giga ingest</b>
          </h1>
        </Link>

        <AuthenticatedTemplate>
          {featureFlags.userManagementPage && (
            <Link
              to={isUserManagementPage ? "/" : "/user-management"}
              unstable_viewTransition
              className={linkClass}
            >
              {isUserManagementPage ? "Ingestion Portal" : "Admin Panel"}
            </Link>
          )}
        </AuthenticatedTemplate>
      </nav>
    </header>
  );
}
