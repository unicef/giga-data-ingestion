import { Outlet } from "react-router-dom";

import UploadBreadcrumbs from "@/components/upload/UploadBreadcrumbs.tsx";

export default function Upload() {
  return (
    <div className="container flex flex-col gap-4 py-6">
      <UploadBreadcrumbs />
      <Outlet />
    </div>
  );
}
