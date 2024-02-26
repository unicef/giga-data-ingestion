import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => null,
  beforeLoad: async () => {
    throw redirect({ to: "/upload" });
  },
});
