import { PropsWithChildren, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useAccount, useMsal } from "@azure/msal-react";
import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";

import gigaLogo from "@/assets/GIGA_logo.png";
import Footer from "@/components/common/Footer.tsx";
import Navbar from "@/components/common/Navbar.tsx";
import NotFound from "@/components/utils/NotFound.tsx";
import TanStackRouterDevtools from "@/components/utils/TanStackRouterDevTools.tsx";
import useGetToken from "@/hooks/useGetToken.ts";
import useLogout from "@/hooks/useLogout.ts";
import info from "@/info.json";
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
  const { setUser } = useStore();
  const { instance } = useMsal();
  const account = useAccount();
  const getToken = useGetToken();
  const logout = useLogout();

  useEffect(() => {
    (async () => {
      if (account) {
        console.debug(account);
        const user = {
          name: account.name ?? "",
          email: account.username,
          roles: (account.idTokenClaims?.groups ?? []) as string[],
        };
        try {
          await getToken();
          setUser(user);
        } catch (err) {
          console.error(err);
          await logout();
        }
      }
    })();
  }, [account, getToken, instance, logout, setUser]);

  return (
    <Base>
      <Outlet />
    </Base>
  );
}
