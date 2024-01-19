import { Link, useLocation } from "react-router-dom";

import { AuthenticatedTemplate } from "@azure/msal-react";

import { useStore } from "@/store.ts";

export default function Navbar() {
  const { featureFlags } = useStore();
  const location = useLocation();

  const linkName =
    location.pathname === "/user-management"
      ? "Ingestion Portal"
      : "Admin Panel";

  const redirectLink =
    location.pathname === "/user-management" ? "/" : "/user-management";

  return (
    <header className="flex-none">
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
              to={redirectLink}
              unstable_viewTransition
              className="text-white"
            >
              {linkName}
            </Link>
          )}
        </AuthenticatedTemplate>
      </nav>
    </header>
  );
}
