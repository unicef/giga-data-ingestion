import { useEffect } from "react";

import { Outlet, createLazyFileRoute } from "@tanstack/react-router";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import AuthenticatedRBACView from "@/components/utils/AuthenticatedRBACView.tsx";
import { useStore } from "@/store.ts";

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
      <div className="container flex flex-col gap-4 py-6">
        <UploadBreadcrumbs />
        <Outlet />
      </div>
    </AuthenticatedRBACView>
  );
}
