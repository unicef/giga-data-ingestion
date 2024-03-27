import { useEffect } from "react";

import { ProgressIndicator, ProgressStep, Stack } from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { api } from "@/api";
import { useStore } from "@/context/store.ts";

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType")({
  component: Layout,
  loader: ({ params }) => {
    const { uploadGroup, uploadType } = params;

    if (!["school-data", "other"].includes(uploadGroup)) {
      throw redirect({ to: "/upload" });
    }

    if (
      uploadGroup === "school-data" &&
      !["geolocation", "coverage"].includes(uploadType)
    ) {
      throw redirect({ to: "/upload" });
    }

    if (uploadGroup === "other" && uploadType !== "unstructured") {
      throw redirect({ to: "/upload" });
    }
  },
});

function Layout() {
  const { uploadType } = Route.useParams();
  const metaschemaName = `school_${uploadType}`;
  const title = uploadType.replace(/-/g, " ");

  useQuery({
    queryFn: () => api.schema.get(metaschemaName),
    queryKey: ["schema", metaschemaName],
  });

  const {
    uploadSlice: { stepIndex },
    uploadSliceActions: { resetUploadSliceState },
  } = useStore();

  useEffect(() => {
    return resetUploadSliceState;
  }, [resetUploadSliceState]);

  return (
    <Stack gap={10}>
      <Stack gap={1}>
        <h2 className="text-[23px] capitalize">{title}</h2>
        <p>
          School data is the dataset of schools location & their attributes like
          name, education level, internet connection, computer count etc.
        </p>
      </Stack>
      <ProgressIndicator currentIndex={stepIndex} spaceEqually>
        <ProgressStep label="1" description="Upload" secondaryLabel="Upload" />
        <ProgressStep
          label="2"
          description="Configure columns"
          secondaryLabel="Configure columns"
        />
        <ProgressStep
          label="3"
          description="Add metadata"
          secondaryLabel="Add metadata"
        />
        <ProgressStep label="4" description="Submit" secondaryLabel="Submit" />
      </ProgressIndicator>

      <Outlet />
    </Stack>
  );
}
