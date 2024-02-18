import { lazy } from "react";

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/router-devtools").then(res => ({
        default: res.TanStackRouterDevtools,
      })),
    );

export default TanStackRouterDevtools;
