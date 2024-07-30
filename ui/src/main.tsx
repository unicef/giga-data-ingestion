import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

import {
  type AuthenticationResult,
  type EventMessage,
  EventType,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import * as Sentry from "@sentry/react";
import { QueryClientProvider } from "@tanstack/react-query";

import { AxiosProvider, queryClient } from "@/api";
import App from "@/app.tsx";
import { msalInstance } from "@/lib/auth.ts";
import "@/styles/index.scss";

if (import.meta.env.SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    sampleRate: 1.0,
    enableTracing: true,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: import.meta.env.VITE_DEPLOY_ENV,
    release: `github.com/unicef/giga-data-ingestion:${import.meta.env.VITE_COMMIT_SHA}`,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

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

    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <AxiosProvider>
            <QueryClientProvider client={queryClient}>
              <HelmetProvider>
                <App />
              </HelmetProvider>
            </QueryClientProvider>
          </AxiosProvider>
        </MsalProvider>
      </React.StrictMode>,
    );
  })
  .catch(console.error);
