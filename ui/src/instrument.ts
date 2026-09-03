import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tunnel: "/tunnel",
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    release: `giga-data-ingestion@${import.meta.env.VITE_COMMIT_SHA}`,
    initialScope: { tags: { app_version: __APP_VERSION__ } },
    sendDefaultPii: false,
  });
}
