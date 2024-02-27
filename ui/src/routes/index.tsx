import { useEffect } from "react";

import { Column, Grid, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import UploadLanding from "@/components/upload/UploadLanding.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/store.ts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { resetUploadState } = useStore();

  useEffect(() => {
    return () => {
      resetUploadState();
    };
  }, [resetUploadState]);

  return (
    <AuthenticatedRBACView>
      <Grid>
        <Column lg={16} className="py-6">
          <Stack gap={6}>
            <UploadBreadcrumbs />
            <UploadLanding />
          </Stack>
        </Column>
      </Grid>
    </AuthenticatedRBACView>
  );
}
