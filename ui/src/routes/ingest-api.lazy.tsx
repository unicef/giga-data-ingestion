import { useEffect } from "react";

import { Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";

export const Route = createLazyFileRoute("/ingest-api")({
  component: IngestApiLayout,
});

function IngestApiLayout() {
  const {
    apiIngestionSliceActions: { resetApiIngestionState: resetState },
  } = useStore();

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  return (
    <AuthenticatedRBACView>
      <div className="container py-6">
        <Stack gap={6}>
          <Outlet />
        </Stack>
      </div>
    </AuthenticatedRBACView>
  );
}
