import { Link, useLocation } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

import { useStore } from "@/store.ts";

export default function Navbar() {
  const { featureFlags } = useStore();
  const location = useLocation();

  const isUserManagementPage = location.pathname === "/user-management";

  return (
    <header className="flex-none">
      {isUserManagementPage ? (
        <nav className="flex h-[80px] items-center justify-between border-b-4 border-primary bg-white p-4 text-primary">
          <Link
            to="/"
            className="flex items-center gap-2"
            unstable_viewTransition
          >
            <img src="/GIGA_logo_blue.png" alt="Giga" />
            <h1 className="text-2xl text-primary">
              <b>giga ingest</b>
            </h1>
          </Link>

          <AuthenticatedTemplate>
            {featureFlags.userManagementPage && (
              <Link to="/" unstable_viewTransition className="text-primary">
                Ingestion Portal
              </Link>
            )}
          </AuthenticatedTemplate>
        </nav>
      ) : (
        <nav className="flex h-[80px] items-center justify-between bg-primary p-4 text-white">
          <Link
            to="/"
            className="flex items-center gap-2"
            unstable_viewTransition
          >
            <img src="/GIGA_logo.png" alt="Giga" />
            <h1 className="text-2xl text-white">
              <b>giga ingest</b>
            </h1>
          </Link>

          <AuthenticatedTemplate>
            {featureFlags.userManagementPage && (
              <Link
                to="/user-management"
                unstable_viewTransition
                className="text-white"
              >
                Admin Panel
              </Link>
            )}
          </AuthenticatedTemplate>
        </nav>
      )}
    </header>
  );
}
