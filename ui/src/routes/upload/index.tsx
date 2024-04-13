import { createFileRoute } from "@tanstack/react-router";

import { uploadsQueryOptions } from "@/api/queryOptions.ts";
import UploadLanding from "@/components/upload/UploadLanding.tsx";

export const Route = createFileRoute("/upload/")({
  component: UploadLanding,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(uploadsQueryOptions),
});
