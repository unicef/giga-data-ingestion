import { useEffect } from "react";

import { Column, Grid, Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useQosStore } from "@/context/apiIngestionStore";

export const Route = createLazyFileRoute("/ingest-api")({
  component: IngestApiLayout,
});

function IngestApiLayout() {
  const { resetQosState } = useQosStore();

  useEffect(() => {
    return () => {
      resetQosState();
    };
  }, [resetQosState]);

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
