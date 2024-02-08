import { useEffect } from "react";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import { useStore } from "@/store.ts";

export const Route = createFileRoute("/upload")({
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
    <AuthenticatedTemplate>
      <div className="container flex flex-col gap-4 py-6">
        <UploadBreadcrumbs />
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  );
}
