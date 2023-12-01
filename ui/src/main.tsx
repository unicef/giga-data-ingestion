import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import { Routes } from "@generouted/react-router/lazy";
import * as Sentry from "@sentry/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { App as AntDApp, ConfigProvider as AntDConfigProvider } from "antd";
import { AuthProvider } from "oidc-react";

import { queryClient } from "@/api";
import { oidcConfig } from "@/lib/auth.ts";
import "@/styles/index.css";
import theme from "@/styles/theme.ts";

if (import.meta.env.PROD && import.meta.env.SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
    tracePropagationTargets: [/^https:\/\/.+\.unitst\.org/],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <QueryClientProvider client={queryClient}>
        <AntDConfigProvider theme={theme}>
          <AntDApp>
            <HelmetProvider>
              <Routes />
            </HelmetProvider>
          </AntDApp>
        </AntDConfigProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);
