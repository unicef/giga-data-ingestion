import { useMemo } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight, Warning } from "@carbon/icons-react";
import { Button, ButtonSet, DataTableHeader, Stack, Tag } from "@carbon/react";
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

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/column-mapping",
)({
  component: UploadColumnMapping,
  loader: ({ params: { uploadType }, context: { queryClient } }) => {
    const {
      uploadSlice: { file, source },
      uploadSliceActions: { setStepIndex },
    } = useStore.getState();

    if (!file) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }

    const metaschemaName =
      uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

    return queryClient.ensureQueryData({
      queryFn: () => api.schema.get(metaschemaName),
      queryKey: ["schema", metaschemaName],
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
    uploadSlice: { detectedColumns, columnMapping, source },
    uploadSliceActions: {
      decrementStepIndex,
      incrementStepIndex,
      setColumnMapping,
      setColumnLicense,
    },
  } = useStore();

  const { uploadType } = Route.useParams();
  const metaschemaName =
    uploadType === "coverage" ? `coverage_${source}` : `school_${uploadType}`;

  const {
    data: { data: schema },
  } = useSuspenseQuery({
    queryFn: () => api.schema.get(metaschemaName),
    queryKey: ["schema", metaschemaName],
  });

  const navigate = useNavigate({ from: Route.fullPath });

  const hookForm = useForm<ConfigureColumnsForm>({
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: {
      mapping: columnMapping,
      license: {},
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
    incrementStepIndex();
    void navigate({ to: "../metadata" });
  };

  const rows = useMemo(
    () =>
      schema.map(column => ({
        id: column.id,
        masterColumn: <MasterColumn column={column} />,
        detectedColumns: (
          <DetectedColumn detectedColumns={detectedColumns} column={column} />
        ),
        license: <ColumnLicense column={column} />,
      })),
    [detectedColumns, schema],
  );

  return (
    <FormProvider {...hookForm}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={8}>
          <section className="flex flex-col gap-8">
            <h2 className="text-[23px] capitalize">Configure Columns</h2>
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
              onClick={decrementStepIndex}
            >
              Cancel
            </Button>
            <Button
              className="w-full"
              isExpressive
              renderIcon={ArrowRight}
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
