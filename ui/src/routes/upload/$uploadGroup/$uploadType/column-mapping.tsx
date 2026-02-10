import React, { useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight, Warning } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  DataTableHeader,
  Loading,
  Stack,
  Tag,
} from "@carbon/react";
import * as Sentry from "@sentry/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import { api } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { PendingComponent } from "@/components/common/PendingComponent.tsx";
import {
  ColumnLicense,
  ConfigureColumnsForm,
  DetectedColumn,
  MasterColumn,
} from "@/components/upload/ColumnMapping.tsx";
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils.ts";
import { getDataPrivacyDocument } from "@/utils/download.ts";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/column-mapping",
)({
  component: UploadColumnMapping,
  loader: ({ params: { uploadType }, context: { queryClient, getState } }) => {
    const {
      uploadSlice: { file, source, mode },
      uploadSliceActions: { setStepIndex },
    } = getState();

    if (
      !file ||
      (uploadType === "coverage" && !source) ||
      (uploadType === "geolocation" && !mode)
    ) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }

    const metaschemaName =
      uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

    return queryClient.ensureQueryData({
      queryFn: () => api.schema.get(metaschemaName, mode === "Update"),
      queryKey: ["schema", metaschemaName, mode, false],
    });
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

const headers: DataTableHeader[] = [
  { key: "masterColumn", header: "Master Data Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
  { key: "license", header: "License" },
];

const COLUMN_WIDTHS = ["33.33%", "33.33%", "33.33%"];

const SCHOOL_COLUMN_CATEGORIES: Record<string, string> = {
  // School profile
  school_id_govt: "School profile",
  school_name: "School profile",
  latitude: "School profile",
  longitude: "School profile",
  education_level_govt: "School profile",
  source_lat_lon: "School profile",
  school_address: "School profile",
  school_establishment_year: "School profile",
  is_school_open: "School profile",
  school_area_type: "School profile",
  school_funding_type: "School profile",
  school_id_govt_type: "School profile",
  building_id_govt: "School profile",

  // School connectivity
  connectivity_govt: "School connectivity",
  connectivity_type_govt: "School connectivity",
  download_speed_contracted: "School connectivity",
  connectivity_govt_ingestion_timestamp: "School connectivity",
  electricity_availability: "School connectivity",
  electricity_type: "School connectivity",
  download_speed_govt: "School connectivity",
  download_speed_benchmark: "School connectivity",

  // School ICT resources
  computer_availability: "School ICT resources",
  device_availability: "School ICT resources",
  computer_lab: "School ICT resources",
  num_computers: "School ICT resources",
  num_tablets: "School ICT resources",
  num_computers_desired: "School ICT resources",
  teachers_trained: "School ICT resources",
  num_robotic_equipment: "School ICT resources",
  computer_govt_collection_year: "School ICT resources",

  // School facilities
  num_classrooms: "School Facilities",
  num_latrines: "School Facilities",
  water_availability: "School Facilities",
  refugee_camp: "School Facilities",
  num_schools_per_building: "School Facilities",

  // Other
  sustainable_business_model: "Other",

  // Other metadata
  school_data_collection_modality: "Other metadata",
  school_data_collection_year: "Other metadata",
  school_data_source: "Other metadata",
};

const SCHOOL_CATEGORY_ORDER: string[] = [
  "School profile",
  "School connectivity",
  "School ICT resources",
  "School Facilities",
  "Other",
  "Other metadata",
];

const REQUIRED_SCHOOL_COLUMNS = new Set<string>([
  "school_id_govt",
  "school_name",
  "latitude",
  "longitude",
  "education_level_govt",
]);

const IMPORTANT_SCHOOL_COLUMNS = new Set<string>([
  "source_lat_lon",
  "connectivity_govt",
  "dowload_speed_contracted",
  "download_speed_contracted",
  "electricity_availability",
]);

function UploadColumnMapping() {
  const {
    uploadSlice: {
      file,
      detectedColumns,
      columnMapping,
      source,
      columnLicense,
      mode,
    },
    uploadSliceActions: { setStepIndex, setColumnMapping, setColumnLicense },
  } = useStore();
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isNullFile, setIsNullFile] = useState(false);
  const [selectedColumns, setSelectedColumns] =
    useState<Record<string, string>>(columnMapping);

  const { uploadType, uploadGroup } = Route.useParams();
  const metaschemaName =
    uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

  const {
    data: { data: schema },
  } = useSuspenseQuery({
    queryFn: () => api.schema.get(metaschemaName, mode === "Update"),
    queryKey: ["schema", metaschemaName, mode, false],
  });

  const navigate = useNavigate({ from: Route.fullPath });

  // Initialize license values for mandatory columns to ODBL (except school_id_govt)
  const defaultLicenseValues = useMemo(() => {
    const licenseDefaults = { ...columnLicense };
    schema.forEach(column => {
      if (
        !column.is_nullable &&
        column.name in columnMapping &&
        column.name !== "school_id_govt"
      ) {
        licenseDefaults[column.name] = "ODBL";
      }
    });
    return licenseDefaults;
  }, [columnLicense, columnMapping, schema]);

  const hookForm = useForm<ConfigureColumnsForm>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      mapping: columnMapping,
      license: defaultLicenseValues,
    },
    shouldFocusError: true,
  });
  const { handleSubmit } = hookForm;
  const onSubmit: SubmitHandler<ConfigureColumnsForm> = data => {
    // Ensure mandatory columns are set to ODBL (except school_id_govt)
    const enforcedLicense = { ...data.license };
    schema.forEach(column => {
      if (
        !column.is_nullable &&
        column.name in data.mapping &&
        column.name !== "school_id_govt"
      ) {
        enforcedLicense[column.name] = "ODBL";
      }
    });

    const dataWithNullsReplaced: ConfigureColumnsForm = {
      mapping: Object.fromEntries(
        Object.entries(data.mapping).filter(([, value]) => Boolean(value)),
      ),
      license: Object.fromEntries(
        Object.entries(enforcedLicense).filter(([, value]) => Boolean(value)),
      ),
    };
    setColumnMapping(dataWithNullsReplaced.mapping);
    setColumnLicense(dataWithNullsReplaced.license);
    setStepIndex(2);
    setIsNavigating(true);

    if (file == null) {
      // Log to Sentry with context
      Sentry.captureException(
        new Error("File upload attempted with missing file"),
        {
          tags: {
            component: "ColumnMapping",
            route: "upload-column-mapping",
            uploadType,
            uploadGroup,
          },
          extra: {
            uploadSlice: {
              hasFile: !!file,
              hasColumnMapping: !!dataWithNullsReplaced.mapping,
              stepIndex: 2,
              mode: mode,
              source: source,
            },
            formData: data,
            timestamp: new Date().toISOString(),
          },
        },
      );

      setIsNullFile(true);
    }

    void navigate({ to: "../metadata" });
  };

  const isSchoolSchema = metaschemaName.startsWith("school_");

  const categorizedRows = useMemo(() => {
    const categoryRows: Record<
      string,
      {
        id: string;
        masterColumn: React.ReactNode;
        detectedColumns: React.ReactNode;
        license: React.ReactNode;
      }[]
    > = {};

    const uncategorized: {
      id: string;
      masterColumn: React.ReactNode;
      detectedColumns: React.ReactNode;
      license: React.ReactNode;
    }[] = [];

    schema.forEach(column => {
      const adjustedColumn =
        isSchoolSchema &&
        (REQUIRED_SCHOOL_COLUMNS.has(column.name) ||
          IMPORTANT_SCHOOL_COLUMNS.has(column.name))
          ? {
              ...column,
              is_nullable: REQUIRED_SCHOOL_COLUMNS.has(column.name)
                ? false
                : column.is_nullable,
              is_important: IMPORTANT_SCHOOL_COLUMNS.has(column.name)
                ? true
                : column.is_important,
            }
          : column;

      const row = {
        id: column.id,
        masterColumn: <MasterColumn column={adjustedColumn} />,
        detectedColumns: (
          <DetectedColumn
            column={adjustedColumn}
            detectedColumns={detectedColumns}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
          />
        ),
        license: <ColumnLicense column={adjustedColumn} />,
      };

      if (isSchoolSchema) {
        const category = SCHOOL_COLUMN_CATEGORIES[column.name];
        if (category) {
          if (!categoryRows[category]) {
            categoryRows[category] = [];
          }
          categoryRows[category].push(row);
          return;
        }
      }

      uncategorized.push(row);
    });

    return { categoryRows, uncategorized };
  }, [detectedColumns, isSchoolSchema, schema, selectedColumns]);

  const DESCRIPTION = (
    <>
      <p>
        Below is a list of all possible columns which can be created from your
        data upload.
      </p>
      <p>
        Please fill in and map each column from your file to the expected field
        names. It is important to complete this page as accurately as possible,
        any incorrect mappings will result in the failure of data validation
        checks and your data not being uploaded correctly.{" "}
      </p>
      <p>
        Finally select the applicable licence for each field. Please note that
        the licence selected will determine who can access this data via the
        Giga Sharing API .{" "}
      </p>
      <p>
        If you are unsure on which licence to provide, please consult our data
        sharing and privacy framework by clicking{" "}
        <a
          onClick={async () => {
            if (isPrivacyLoading) return;

            setIsPrivacyLoading(true);
            await getDataPrivacyDocument();
            setIsPrivacyLoading(false);
          }}
          className={cn("cursor-pointer", {
            "cursor-wait": isPrivacyLoading,
          })}
        >
          here
        </a>
        .
      </p>
    </>
  );

  return (
    <FormProvider {...hookForm}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={8}>
          <section className="flex flex-col gap-8">
            <h2 className="text-[23px] capitalize">Configure Columns</h2>
            <div>{DESCRIPTION}</div>
            <div className="flex gap-4">
              <Tag type="red">*Required</Tag>
              <Tag type="purple">
                <div className="flex align-middle">
                  <Warning /> Important
                </div>
              </Tag>
            </div>
          </section>

          <section className="w-full space-y-8">
            {isSchoolSchema ? (
              <>
                {SCHOOL_CATEGORY_ORDER.map(category => {
                  const rowsForCategory =
                    categorizedRows.categoryRows[category];
                  if (!rowsForCategory || rowsForCategory.length === 0) {
                    return null;
                  }

                  return (
                    <div key={category} className="space-y-2">
                      <h3 className="text-lg font-semibold">{category}</h3>
                      <DataTable
                        columns={headers}
                        rows={rowsForCategory}
                        columnWidths={COLUMN_WIDTHS}
                      />
                    </div>
                  );
                })}
                {categorizedRows.uncategorized.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Other fields</h3>
                    <DataTable
                      columns={headers}
                      rows={categorizedRows.uncategorized}
                      columnWidths={COLUMN_WIDTHS}
                    />
                  </div>
                )}
              </>
            ) : (
              <DataTable
                columns={headers}
                rows={categorizedRows.uncategorized}
                columnWidths={COLUMN_WIDTHS}
              />
            )}
          </section>
          {/* 
          <Suspense>
            <ReactHookFormDevTools control={control as unknown as Control} />
          </Suspense> */}

          <ButtonSet className="w-full">
            <Button
              as={Link}
              className="w-full"
              isExpressive
              kind="secondary"
              renderIcon={ArrowLeft}
              to=".."
              onClick={() => setStepIndex(0)}
            >
              Cancel
            </Button>
            <Button
              className="w-full"
              disabled={isNavigating}
              isExpressive
              renderIcon={
                isNavigating
                  ? (props: React.ComponentProps<typeof Loading>) => (
                      <Loading small={true} withOverlay={false} {...props} />
                    )
                  : ArrowRight
              }
              type="submit"
            >
              Proceed
            </Button>
          </ButtonSet>
          {isNullFile && (
            <div className="text-giga-red">
              File is missing at this step, please upload the file again
            </div>
          )}
        </Stack>
      </form>
    </FormProvider>
  );
}
