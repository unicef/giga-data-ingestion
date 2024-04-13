import { lazy } from "react";

export const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/router-devtools").then(res => ({
        default: res.TanStackRouterDevtools,
      })),
    );

export const TanStackQueryDevTools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then(res => ({
        default: res.ReactQueryDevtools,
      })),
    );
