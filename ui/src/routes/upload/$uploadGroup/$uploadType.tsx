import { useEffect } from "react";

import { ProgressIndicator, ProgressStep, Stack } from "@carbon/react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { useStore } from "@/context/store.ts";

const doRedirect = redirect({
  to: "/upload",
  search: { page: DEFAULT_PAGE_NUMBER, page_size: DEFAULT_PAGE_SIZE },
});

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType")({
  component: Layout,
  loader: ({ params }) => {
    const { uploadGroup, uploadType } = params;

    if (!["school-data", "other"].includes(uploadGroup)) {
      throw doRedirect;
    }

    if (
      uploadGroup === "school-data" &&
      !["geolocation", "coverage"].includes(uploadType)
    ) {
      throw doRedirect;
    }

    if (uploadGroup === "other" && uploadType !== "unstructured") {
      throw doRedirect;
    }
  },
});

function Layout() {
  const { uploadType } = Route.useParams();
  const title = uploadType.replace(/-/g, " ");

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
