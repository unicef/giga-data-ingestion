import * as Sentry from "@sentry/react";

import { router } from "@/router.tsx";

if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tunnel: "/tunnel",
    environment: import.meta.env.VITE_DEPLOY_ENV,
    release: `github.com/unicef/giga-data-ingestion:${
      import.meta.env.VITE_COMMIT_SHA
    }`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
