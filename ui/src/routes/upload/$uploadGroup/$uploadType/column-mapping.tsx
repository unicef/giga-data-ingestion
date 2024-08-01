import { useMemo, useState } from "react";
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

function UploadColumnMapping() {
  const {
    uploadSlice: {
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
  const [selectedColumns, setSelectedColumns] =
    useState<Record<string, string>>(columnMapping);

  const { uploadType } = Route.useParams();
  const metaschemaName =
    uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

  const {
    data: { data: schema },
  } = useSuspenseQuery({
    queryFn: () => api.schema.get(metaschemaName, mode === "Update"),
    queryKey: ["schema", metaschemaName, mode, false],
  });

  const navigate = useNavigate({ from: Route.fullPath });

  const hookForm = useForm<ConfigureColumnsForm>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      mapping: columnMapping,
      license: columnLicense,
    },
    shouldFocusError: true,
  });
  const { handleSubmit } = hookForm;
  const onSubmit: SubmitHandler<ConfigureColumnsForm> = data => {
    const dataWithNullsReplaced: ConfigureColumnsForm = {
      mapping: Object.fromEntries(
        Object.entries(data.mapping).filter(([, value]) => Boolean(value)),
      ),
      license: Object.fromEntries(
        Object.entries(data.license).filter(([, value]) => Boolean(value)),
      ),
    };
    setColumnMapping(dataWithNullsReplaced.mapping);
    setColumnLicense(dataWithNullsReplaced.license);
    setStepIndex(2);
    setIsNavigating(true);
    void navigate({ to: "../metadata" });
  };

  const rows = useMemo(
    () =>
      schema.map(column => ({
        id: column.id,
        masterColumn: <MasterColumn column={column} />,
        detectedColumns: (
          <DetectedColumn
            column={column}
            detectedColumns={detectedColumns}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
          />
        ),
        license: <ColumnLicense column={column} />,
      })),
    [detectedColumns, schema, selectedColumns],
  );

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

          <section className="w-3/4">
            <DataTable columns={headers} rows={rows} />
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
                  ? props => (
                      <Loading small={true} withOverlay={false} {...props} />
                    )
                  : ArrowRight
              }
              type="submit"
            >
              Proceed
            </Button>
          </ButtonSet>
        </Stack>
      </form>
    </FormProvider>
  );
}
