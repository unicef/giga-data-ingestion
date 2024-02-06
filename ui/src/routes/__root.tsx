import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Outlet } from "react-router-dom";

import { useMsal } from "@azure/msal-react";
import { createRootRoute } from "@tanstack/react-router";

import { axi } from "@/api";
import Footer from "@/components/common/Footer.tsx";
import Navbar from "@/components/common/Navbar.tsx";
import info from "@/info.json";
import { loginRequest } from "@/lib/auth.ts";
import { useStore } from "@/store.ts";

export const Route = createRootRoute({
  component: Layout,
});

function Layout() {
  const { setUser } = useStore();
  const { accounts, instance } = useMsal();

  useEffect(() => {
    (async () => {
      if (accounts.length > 0) {
        const account = accounts[0];
        console.log(account);
        setUser({
          name: account.name ?? "",
          email: account.username,
          roles: account.idTokenClaims?.roles ?? [],
        });

        const result = await instance.acquireTokenSilent(loginRequest);
        axi.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${result.accessToken}`;
      }
    })();
  }, [accounts, instance, setUser]);

  return (
    <div className="flex h-screen min-h-screen flex-col">
      <Helmet>
        <title>{info.title}</title>
        <meta name="description" content={info.description} />
      </Helmet>
      <Navbar />
      <main className="flex-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
