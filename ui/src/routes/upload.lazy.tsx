import { useEffect } from "react";

import { Column, Grid, Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";

export const Route = createLazyFileRoute("/upload")({
  component: UploadLayout,
});

function UploadLayout() {
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
            <Outlet />
          </Stack>
        </Column>
      </Grid>
    </AuthenticatedRBACView>
  );
}
