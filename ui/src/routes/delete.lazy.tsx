import { useEffect } from "react";

import { Stack } from "@carbon/react";
import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import DeleteBreadCrumbs from "@/components/delete/DeleteBreadCrumbs";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import Forbidden from "@/components/utils/Forbidden";
import { useStore } from "@/context/store";
import useRoles from "@/hooks/useRoles";

export const Route = createLazyFileRoute("/delete")({
  component: DeleteLayout,
});

function DeleteLayout() {
  const {
    uploadSliceActions: { resetUploadSliceState: resetState },
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
            <DeleteBreadCrumbs />
            <Outlet />
          </Stack>
        </div>
      ) : (
        <Forbidden />
      )}
    </AuthenticatedRBACView>
  );
}
