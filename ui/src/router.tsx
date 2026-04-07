import { createRouter } from "@tanstack/react-router";

import { queryClient } from "@/api";
import { useStore } from "@/context/store.ts";
import { routeTree } from "@/routeTree.gen.ts";

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    getState: useStore.getState,
  },
  // defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
