import { Add } from "@carbon/icons-react";
import { Button, Section, Stack } from "@carbon/react";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";

export const Route = createFileRoute(
  "/upload/$uploadGroup/options/$uploadType",
)({
  component: Options,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

const STRUCTURED_DESCRIPTION = (
  <>
    <p>
      Structured datasets are custom production datasets that follow a
      predefined schema and structure, designed for analytical queries and
      reporting.
    </p>
    <p>
      Once uploaded, these datasets will be available for querying and analysis
      in Superset dashboards and reports.
    </p>
  </>
);

const UNSTRUCTURED_DESCRIPTION = (
  <>
    <p>
      Data such as geospatial and shape files, used to provide geographical
      information and boundaries which represent the landscape of countries.
    </p>
    <p>
      Any file uploaded must be no larger than 100MB and be in one of the
      accepted file formats: [bmp, .gif, .jpeg, .jpg, .png, .tif, .tiff, .csv,
      .xlsx, .xls, .pdf, .doc, .docx]
    </p>
  </>
);

const HEALTH_MASTER_DESCRIPTION = (
  <>
    <p>
      Health Master datasets are specialized production datasets used for
      health-related master records and reference data management.
    </p>
    <p>
      Once uploaded, these datasets are available for downstream ingestion,
      validation, and reporting workflows.
    </p>
  </>
);

function Options() {
  const { uploadGroup: _uploadGroup, uploadType: _uploadType } =
    Route.useParams();

  return (
    <Section>
      <Stack gap={8}>
        <Stack gap={4}>
          <h1>Choose Dataset Type</h1>
          <p>Please select the type of dataset you want to upload:</p>
        </Stack>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-gray-200 p-6">
            <Stack gap={4}>
              <h2 className="text-xl font-semibold">Structured Dataset</h2>
              {STRUCTURED_DESCRIPTION}
              <Button
                as={Link}
                to="/upload/$uploadGroup/$uploadType"
                params={{
                  uploadGroup: "other",
                  uploadType: "structured",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                Upload Structured Dataset
              </Button>
            </Stack>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <Stack gap={4}>
              <h2 className="text-xl font-semibold">Unstructured Dataset</h2>
              {UNSTRUCTURED_DESCRIPTION}
              <Button
                as={Link}
                to="/upload/$uploadGroup/$uploadType"
                params={{
                  uploadGroup: "other",
                  uploadType: "unstructured",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                Upload Unstructured Dataset
              </Button>
            </Stack>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <Stack gap={4}>
              <h2 className="text-xl font-semibold">Health Master Dataset</h2>
              {HEALTH_MASTER_DESCRIPTION}
              <Button
                as={Link}
                to="/upload/$uploadGroup/$uploadType"
                params={{
                  uploadGroup: "other",
                  uploadType: "health-master",
                }}
                className="w-full"
                size="xl"
                renderIcon={Add}
              >
                Upload Health Master Dataset
              </Button>
            </Stack>
          </div>
        </div>
      </Stack>
    </Section>
  );
}

export default Options;
