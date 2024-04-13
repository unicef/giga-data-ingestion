import { useEffect } from "react";

import { Column, Grid, Stack } from "@carbon/react";
import { createFileRoute } from "@tanstack/react-router";

import { uploadsQueryOptions } from "@/api/queryOptions.ts";
import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import UploadLanding from "@/components/upload/UploadLanding.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";

export const Route = createFileRoute("/")({
  component: Index,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(uploadsQueryOptions),
});

function Index() {
  const {
    uploadSliceActions: { resetUploadSliceState },
  } = useStore();
  useEffect(() => {
    return () => {
      resetUploadSliceState();
    };
  }, [resetUploadSliceState]);

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
