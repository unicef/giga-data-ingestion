import { createLazyFileRoute } from "@tanstack/react-router";

import UploadLanding from "@/components/upload/UploadLanding.tsx";

export const Route = createLazyFileRoute("/upload/")({
  component: UploadLanding,
});
