import { useEffect } from "react";

import { useIsAuthenticated } from "@azure/msal-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import Login from "@/components/landing/Login.tsx";
import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";
import { useStore } from "@/store.ts";

export const Route = createFileRoute("/upload")({
  component: UploadLayout,
});

function UploadLayout() {
  const { resetUploadState } = useStore();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    return () => {
      resetUploadState();
    };
  }, [resetUploadState]);

  return isAuthenticated ? (
    <div className="container flex flex-col gap-4 py-6">
      <UploadBreadcrumbs />
      <Outlet />
    </div>
  ) : (
    <Login />
  );
}
