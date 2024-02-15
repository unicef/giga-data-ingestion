import { PropsWithChildren, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useMsal } from "@azure/msal-react";
import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { axi } from "@/api";
import gigaLogo from "@/assets/GIGA_logo.png";
import Footer from "@/components/common/Footer.tsx";
import Navbar from "@/components/common/Navbar.tsx";
import info from "@/info.json";
import { loginRequest } from "@/lib/auth.ts";
import { useStore } from "@/store.ts";

export const Route = createRootRoute({
  component: Layout,
  notFoundComponent: NotFound,
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
      <TanStackRouterDevtools initialIsOpen={false} />
    </div>
  );
}

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
    <Base>
      <Outlet />
    </Base>
  );
}

function NotFound() {
  return (
    <Base>
      <div className="flex h-full items-center justify-center gap-4">
        <h2>404</h2>
        <h2 className="border-l border-solid pl-4">Not Found</h2>
      </div>
    </Base>
  );
}
