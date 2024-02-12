import { useEffect } from "react";

import { AuthenticatedTemplate } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import CheckFileUploadsBreadCrumbs from "@/components/upload/CheckFileUploadsBreadCrumbs";
import { useStore } from "@/store.ts";

export const Route = createFileRoute("/check-file-uploads")({
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
        <CheckFileUploadsBreadCrumbs />
        <Outlet />
      </div>
    </AuthenticatedTemplate>
  );
}
