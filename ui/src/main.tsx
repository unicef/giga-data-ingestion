import ReactDOM from "react-dom/client";

import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import {
  browserTracingIntegration,
  replayIntegration,
  init as sentryInit,
} from "@sentry/react";

import App from "@/app.tsx";
import "@/styles/index.scss";

if (import.meta.env.SENTRY_DSN && import.meta.env.PROD) {
  sentryInit({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      browserTracingIntegration(),
      replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    sampleRate: 1.0,
    enableTracing: true,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: import.meta.env.VITE_DEPLOY_ENV,
    release: `github.com/unicef/giga-data-ingestion:${
      import.meta.env.VITE_COMMIT_SHA
    }`,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
