import { useEffect } from "react";

import { Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import DeleteBreadCrumbs from "@/components/delete/DeleteBreadCrumbs";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/context/store";

export const Route = createLazyFileRoute("/delete")({
  component: DeleteLayout,
});

function DeleteLayout() {
  const {
    uploadSliceActions: { resetUploadSliceState: resetState },
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
          <DeleteBreadCrumbs />
          <Outlet />
        </Stack>
      </div>
    </AuthenticatedRBACView>
  );
}
