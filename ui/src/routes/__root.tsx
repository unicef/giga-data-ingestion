import { ComponentProps, PropsWithChildren, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useAccount, useMsal } from "@azure/msal-react";
import { ProgressBar as CarbonProgressBar } from "@carbon/react";
import { useIsFetching } from "@tanstack/react-query";
import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";

import gigaLogo from "@/assets/GIGA_logo.png";
import homeBg from "@/assets/home-bg.jpg";
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

function ProgressBar(props: Partial<ComponentProps<typeof CarbonProgressBar>>) {
  // @ts-expect-error required props that are not actually required
  return <CarbonProgressBar {...props} />;
}

function Base({ children }: PropsWithChildren) {
  const isFetching = useIsFetching();

  return (
    <div className="flex h-screen min-h-screen flex-col">
      <Helmet>
        <title>{info.title}</title>
        <meta name="description" content={info.description} />
        <link rel="icon" type="image/png" href={gigaLogo} />
        <meta property="og:title" content={info.title} />
        <meta property="og:description" content={info.description} />
        <meta property="og:image" content={homeBg} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
      </Helmet>
      <ScrollRestoration />

      {isFetching ? (
        <ProgressBar className="absolute bottom-0 w-screen" />
      ) : null}
      <Navbar />
      <main className="flex-auto flex-row">{children}</main>
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
