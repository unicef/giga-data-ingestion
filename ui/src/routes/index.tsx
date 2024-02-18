import { createFileRoute } from "@tanstack/react-router";

import Landing from "@/components/landing/Landing.tsx";
import AuthenticatedView from "@/components/utils/AuthenticatedView.tsx";

export const Route = createFileRoute("/")({
  component: () => (
    <AuthenticatedView>
      <Landing />
    </AuthenticatedView>
  ),
});
