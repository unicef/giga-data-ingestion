import { useEffect } from "react";

import { Column, Grid, Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";

export const Route = createFileRoute("/ingest-api")({
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
      <Grid>
        <Column lg={16} className="py-6">
          <Stack gap={6}>
            {/* TODO: Ingest Breadcrumbs */}
            <Outlet />
          </Stack>
        </Column>
      </Grid>
    </AuthenticatedRBACView>
  );
}
