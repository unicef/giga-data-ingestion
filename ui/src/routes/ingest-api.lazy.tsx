import { useEffect } from "react";

import { Column, Grid, Stack } from "@carbon/react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useQosStore } from "@/context/qosStore";

export const Route = createFileRoute("/ingest-api")({
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
