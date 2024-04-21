import React, { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";

import {
  AuthenticationResult,
  EventMessage,
  EventType,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { AxiosProvider, queryClient } from "@/api";
import { msalInstance } from "@/lib/auth.ts";
import { routeTree } from "@/routeTree.gen.ts";

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  useEffect(() => {
    msalInstance
      .initialize()
      .then(() => {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }

        msalInstance.addEventCallback((event: EventMessage) => {
          if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const { account } = event.payload as AuthenticationResult;
            msalInstance.setActiveAccount(account);
          }
        });
      })
      .catch(console.error);
  }, []);

  return (
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <AxiosProvider>
          <QueryClientProvider client={queryClient}>
            <HelmetProvider>
              <RouterProvider router={router} />
            </HelmetProvider>
          </QueryClientProvider>
        </AxiosProvider>
      </MsalProvider>
    </React.StrictMode>
  );
}
