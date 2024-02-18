import { PropsWithChildren, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useMsal } from "@azure/msal-react";
import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";

import { axi, useApi } from "@/api";
import gigaLogo from "@/assets/GIGA_logo.png";
import Footer from "@/components/common/Footer.tsx";
import Navbar from "@/components/common/Navbar.tsx";
import NotFound from "@/components/utils/NotFound.tsx";
import TanStackRouterDevtools from "@/components/utils/TanStackRouterDevTools.tsx";
import info from "@/info.json";
import { loginRequest } from "@/lib/auth.ts";
import { useStore } from "@/store.ts";

export const Route = createRootRoute({
  component: Layout,
  notFoundComponent: () => (
    <Base>
      <NotFound />
    </Base>
  ),
});

function Base({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen min-h-screen flex-col">
      <Helmet>
        <title>{info.title}</title>
        <meta name="description" content={info.description} />
        <link rel="icon" type="image/png" href={gigaLogo} />
      </Helmet>
      <ScrollRestoration />

      <Navbar />
      <main className="flex-auto">{children}</main>
      <Footer />

      <Suspense>
        <TanStackRouterDevtools initialIsOpen={false} />
      </Suspense>
    </div>
  );
}

function Layout() {
  const api = useApi();
  const { setUser } = useStore();
  const { accounts, instance } = useMsal();

  useEffect(() => {
    (async () => {
      if (accounts.length > 0) {
        const account = accounts[0];
        console.debug(account);
        const user = {
          name: account.name ?? "",
          email: account.username,
          roles: (account.idTokenClaims?.groups ?? []) as string[],
        };
        const result = await instance.acquireTokenSilent(loginRequest);
        axi.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${result.accessToken}`;

        setUser(user);
      }
    })();
  }, [accounts, api, instance, setUser]);

  return (
    <Base>
      <Outlet />
    </Base>
  );
}
