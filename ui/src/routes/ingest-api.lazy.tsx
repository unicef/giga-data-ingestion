import { useEffect } from "react";

import { Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import Forbidden from "@/components/utils/Forbidden";
import { useStore } from "@/context/store";
import useRoles from "@/hooks/useRoles";

export const Route = createLazyFileRoute("/ingest-api")({
  component: IngestApiLayout,
});

function IngestApiLayout() {
  const {
    apiIngestionSliceActions: { resetApiIngestionState: resetState },
  } = useStore();

  const { isAdmin } = useRoles();

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  return (
    <AuthenticatedRBACView>
      {isAdmin ? (
        <div className="container py-6">
          <Stack gap={6}>
            <Outlet />
          </Stack>
        </div>
      ) : (
        <Forbidden />
      )}
    </AuthenticatedRBACView>
  );
}
