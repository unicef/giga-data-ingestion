const TanStackRouterDevTools = import.meta.env.PROD
  ? () => null
  : import("@tanstack/router-devtools").then(res => ({
      default: res.TanStackRouterDevtools,
    }));

export default TanStackRouterDevTools;
