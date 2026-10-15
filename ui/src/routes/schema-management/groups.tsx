import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/schema-management/groups")({
  component: GroupsLayout,
});

function GroupsLayout() {
  return <Outlet />;
}
