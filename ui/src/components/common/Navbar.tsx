import { Link } from "react-router-dom";

import { AuthenticatedTemplate, useMsal } from "@azure/msal-react";
import { Button } from "antd";

import { axi } from "@/api";

export default function Navbar() {
  const { instance, accounts } = useMsal();
  const account = accounts.at(0);

  async function handleLogout() {
    if (account) {
      await instance.logoutPopup({
        mainWindowRedirectUri: "/",
        logoutHint: account.idTokenClaims?.login_hint,
      });
      delete axi.defaults.headers.common["Authorization"];
    }
  }

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
          <div className="flex items-center gap-4">
            <span className="text-neutral-300">
              Logged in as {account?.username ?? ""}
            </span>
            <Button ghost onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </AuthenticatedTemplate>
      </nav>
    </header>
  );
}
