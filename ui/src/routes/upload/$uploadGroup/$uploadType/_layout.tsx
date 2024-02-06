import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/_layout",
)({
  component: Layout,
});

function Layout() {
  const { uploadType } = Route.useParams();
  const title = uploadType.replace(/-/g, " ");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[23px] capitalize">{title}</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur.
      </p>

      <Outlet />
    </div>
  );
}