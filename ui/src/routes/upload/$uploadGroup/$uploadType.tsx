import { useEffect } from "react";

import { ProgressIndicator, ProgressStep, Stack } from "@carbon/react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { useStore } from "@/store.ts";

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
  const title = uploadType.replace(/-/g, " ");

  const { upload, resetUploadState } = useStore();
  const { stepIndex } = upload;

  useEffect(() => {
    return resetUploadState;
  }, [resetUploadState]);

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
          description="Add metadata"
          secondaryLabel="Add metadata"
        />
        {/* TODO: Add column mapping */}
        {/*<ProgressStep*/}
        {/*  label="3"*/}
        {/*  description="Configure columns"*/}
        {/*  secondaryLabel="Configure columns"*/}
        {/*/>*/}
        <ProgressStep
          label="3"
          // description="Data quality review & submit"
          // secondaryLabel="Data quality review & submit"
          secondaryLabel="Submit"
        />
      </ProgressIndicator>

      <Outlet />
    </Stack>
  );
}
