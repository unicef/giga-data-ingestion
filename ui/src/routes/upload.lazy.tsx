import { useEffect } from "react";

import { Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";

export const Route = createLazyFileRoute("/upload")({
  component: UploadLayout,
});

function UploadLayout() {
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
      <div className="container py-6">
        <Stack gap={6}>
          <UploadBreadcrumbs />
          <Outlet />
        </Stack>
      </div>
    </AuthenticatedRBACView>
  );
}
