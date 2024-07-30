import { useEffect, useState } from "react";

import { ProgressIndicator, ProgressStep, Stack } from "@carbon/react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { api } from "@/api";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination.ts";
import { useStore } from "@/context/store.ts";
import { cn } from "@/lib/utils.ts";
import { saveFile } from "@/utils/download.ts";

const doRedirect = redirect({
  to: "/upload",
  search: { page: DEFAULT_PAGE_NUMBER, page_size: DEFAULT_PAGE_SIZE },
});

export const Route = createFileRoute("/upload/$uploadGroup/$uploadType")({
  component: Layout,
  loader: ({ params: { uploadGroup, uploadType }, context: { queryClient } }) => {
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

    if (uploadType === "geolocation") {
      return queryClient.ensureQueryData({
        queryFn: () => api.schema.get(`school_${uploadType}`),
        queryKey: ["schema", `school_${uploadType}`],
      });
    }
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

const UNSTRUCTURED_DESCRIPTION = (
  <>
    <p>
      Data such as geospatial and shape files, used to provide geographical information
      and boundaries which represent the landscape of countries.
    </p>
    <p>
      Any file uploaded must be no larger than 10MB and be in one of the accepted file
      formats: [bmp, .gif, .jpeg, .jpg, .png, .tif, .tiff or .csv]
    </p>
  </>
);
function Layout() {
  const { uploadType, uploadGroup } = Route.useParams();
  const title = uploadType.replace(/-/g, " ");
  const isUnstructured = uploadGroup === "other" && uploadType === "unstructured";
  const {
    uploadSlice: { stepIndex },
    uploadSliceActions: { resetUploadSliceState },
  } = useStore();
  const [isSchemaDownloading, setIsSchemaDownloading] = useState(false);

  useEffect(() => {
    return resetUploadSliceState;
  }, [resetUploadSliceState]);

  async function downloadGeolocationSchema() {
    const schema = await api.schema.download("school_geolocation");

    if (schema) {
      saveFile(schema);
    }
  }

  const GEOLOCATION_DESCRIPTION = (
    <>
      <p>
        Geolocation data is the foundation of Project Giga and provides a dataset of
        schools location and their attributes, such as; name, education level,
        geography, internet connection, computer count, etc.
      </p>
      <p>
        To successfully upload your data, you will need to ensure it has the correct
        structure.{" "}
      </p>
      <p>
        Click{" "}
        <a
          className={cn("cursor-pointer", {
            "cursor-wait": isSchemaDownloading,
          })}
          onClick={async () => {
            if (isSchemaDownloading) return;

            setIsSchemaDownloading(true);
            await downloadGeolocationSchema();
            setIsSchemaDownloading(false);
          }}
        >
          here
        </a>{" "}
        to download a template copy of the expected schema. Please use this as a guide
        for structure as well as the necessary data types for each column. We ask that
        you take special note of those columns marked as “Mandatory” and ensure they all
        filled in correctly.{" "}
      </p>
      <p>Accepted file formats include: [.csv, .xlsx, .xls]</p>
    </>
  );

  const COVERAGE_DESCRIPTION = (
    <>
      <p>
        Data representing the overall coverage profile of schools, including coverage
        type, level, connectivity and availability. This data is used to build a picture
        of the overall coverage of schools across the world.
      </p>
      <p>
        To successfully upload your data, you will need to ensure it has the correct
        structure but depending on the source of your data (e.g. Meta, ITU, etc...) the
        expected schema will vary.
      </p>
      <p>Please either use either the Meta or ITU templates to help assist you.</p>
      <p>
        Please take special note of those columns marked as “Mandatory” and ensure they
        all filled in correctly.
      </p>
      <p>
        Any file uploaded must be no larger than 10MB and be in one of the accepted file
        formats: [.csv, .xlsx, .xls.]
      </p>
    </>
  );

  return (
    <Stack gap={10}>
      <Stack gap={1}>
        <h2 className="text-[23px] capitalize">{title}</h2>
        <div>
          {title === "geolocation"
            ? GEOLOCATION_DESCRIPTION
            : title === "coverage"
              ? COVERAGE_DESCRIPTION
              : UNSTRUCTURED_DESCRIPTION}
        </div>
      </Stack>

      {isUnstructured ? (
        <ProgressIndicator currentIndex={stepIndex} spaceEqually>
          <ProgressStep label="1" description="Upload" secondaryLabel="Upload" />
          <ProgressStep
            label="2"
            description="Add metadata"
            secondaryLabel="Add metadata"
          />
          <ProgressStep label="3" description="Submit" secondaryLabel="Submit" />
        </ProgressIndicator>
      ) : (
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
      )}

      <Outlet />
    </Stack>
  );
}
