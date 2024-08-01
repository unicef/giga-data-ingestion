import { PropsWithChildren, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { useAccount, useMsal } from "@azure/msal-react";
import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  ScrollRestoration,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import gigaLogo from "@/assets/GIGA_logo.png";
import homeBg from "@/assets/home-bg.jpg";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import Footer from "@/components/common/Footer.tsx";
import Navbar from "@/components/common/Navbar.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import ToastNotification from "@/components/user-management/ToastNotification";
import {
  TanStackQueryDevTools,
  TanStackRouterDevtools,
} from "@/components/utils/DevTools.tsx";
import NotFound from "@/components/utils/NotFound.tsx";
import { useStore } from "@/context/store";
import useGetToken from "@/hooks/useGetToken.ts";
import useLogout from "@/hooks/useLogout.ts";
import info from "@/info.json";

interface RouteContext {
  queryClient: QueryClient;
  getState: typeof useStore.getState;
}

export const Route = createRootRouteWithContext<RouteContext>()({
  component: Layout,
  notFoundComponent: () => (
    <Base>
      <NotFound />
    </Base>
  ),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

function Base({ children }: PropsWithChildren) {
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

      <Navbar />
      <main className="flex-auto flex-row">{children}</main>
      <Footer />

      <Suspense fallback={null}>
        <TanStackRouterDevtools initialIsOpen={false} />
        <TanStackQueryDevTools initialIsOpen={false} />
      </Suspense>
    </div>
  );
}

function Layout() {
  const {
    appStateActions: { setUser, setNotificiation },
    appState: { notification },
  } = useStore();
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
      <ToastNotification
        show={notification}
        setShow={setNotificiation}
        kind="success"
        caption="Rows to delete successfully uploaded"
        title="Success"
      />
      <Outlet />
    </Base>
  );
}
