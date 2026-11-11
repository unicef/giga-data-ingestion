import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/schema-management/groups/")({
  beforeLoad: () => {
    throw redirect({ to: "/schema-management" });
  },
});
