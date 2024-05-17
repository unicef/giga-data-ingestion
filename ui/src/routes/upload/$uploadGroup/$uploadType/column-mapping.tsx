import { useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight, Warning } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Link as CarbonLink,
  DataTableHeader,
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
import { sortSchema } from "@/utils/string";

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
      Finally select the applicable licence for each field. Please note that the
      licence selected will determine who can access this data via the Giga
      Sharing API .{" "}
    </p>
    <p>
      If you are unsure on which licence to provide, please consult our data
      sharing and privacy framework by clicking{" "}
      <CarbonLink href="https://unicef.sharepoint.com/teams/OOI/DocumentLibrary1/Forms/AllItems.aspx?id=%2Fteams%2FOOI%2FDocumentLibrary1%2FGiga%2F004%20Country%20support%2F%5FGlobal%20%2D%20Country%20info%20pack%2F08%2E%20Giga%20Data%20Sharing%20Framework%2FGiga%20Data%20Sharing%20Framework%5FENG%5FJan%5F2024%5FFinal%2Epdf&viewid=8a9966f4%2De600%2D450e%2Daa6d%2D71ab396305cf&parent=%2Fteams%2FOOI%2FDocumentLibrary1%2FGiga%2F004%20Country%20support%2F%5FGlobal%20%2D%20Country%20info%20pack%2F08%2E%20Giga%20Data%20Sharing%20Framework">
        here.
      </CarbonLink>
    </p>
  </>
);

const headers: DataTableHeader[] = [
  { key: "masterColumn", header: "Master Data Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
  { key: "license", header: "License" },
];

function UploadColumnMapping() {
  const {
    uploadSlice: { detectedColumns, columnMapping, source },
    uploadSliceActions: { setStepIndex, setColumnMapping, setColumnLicense },
  } = useStore();

  const [selectedColumns, setSelectedColumns] =
    useState<Record<string, string>>(columnMapping);

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
    setStepIndex(2);
    void navigate({ to: "../metadata" });
  };

  const rows = useMemo(
    () =>
      schema.sort(sortSchema).map(column => ({
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
