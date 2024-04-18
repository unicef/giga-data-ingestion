import { Suspense } from "react";
import { Control, SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight, Warning } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  DataTableHeader,
  DataTableSkeleton,
  DefinitionTooltip,
  Select,
  SelectItem,
  Stack,
  Tag,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import { api } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
import { useStore } from "@/context/store";
import { licenseOptions } from "@/mocks/metadataFormValues.tsx";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/column-mapping",
)({
  component: UploadColumnMapping,
  loader: () => {
    const {
      uploadSlice: { file },
      uploadSliceActions: { setStepIndex },
    } = useStore.getState();

    if (!file) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }
  },
});

const headers: DataTableHeader[] = [
  { key: "masterColumn", header: "Master Data Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
  { key: "license", header: "License" },
];

interface ConfigureColumnsForm {
  mapping: Record<string, string>;
  license: Record<string, string>;
}

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

  const { data: schemaQuery, isLoading } = useQuery({
    queryFn: () => api.schema.get(metaschemaName),
    queryKey: ["schema", metaschemaName],
  });

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
  } = useForm<ConfigureColumnsForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      mapping: columnMapping,
      license: {},
    },
  });

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

  const schema = schemaQuery?.data ?? [];

  const rows = isLoading
    ? []
    : schema.map(column => ({
        id: column.id,
        masterColumn: (
          <div className="flex items-center gap-4">
            {column.description ? (
              <DefinitionTooltip
                align="right"
                definition={column.description}
                openOnHover
              >
                <div className="flex items-center gap-1">
                  <div>{column.name}</div>
                  <div>
                    {!column.is_nullable ? (
                      <span className="text-giga-red">*</span>
                    ) : column.is_important ? (
                      <Warning className="text-purple-600" />
                    ) : null}
                  </div>
                </div>
              </DefinitionTooltip>
            ) : (
              <div className="flex items-center gap-1">
                <div>{column.name}</div>
                <div>
                  {!column.is_nullable ? (
                    <span className="text-giga-red">*</span>
                  ) : column.is_important ? (
                    <Warning className="text-purple-600" />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ),
        detectedColumns: (
          <div className="w-11/12 px-2 pb-2">
            <Select
              id={`mapping.${column.name}`}
              invalid={column.name in (errors.mapping ?? {})}
              labelText=""
              {...register(`mapping.${column.name}`, {
                required: !column.is_nullable,
              })}
            >
              <SelectItem text="" value="" />
              {detectedColumns.map(detectedColumn => (
                <SelectItem
                  key={detectedColumn}
                  text={detectedColumn}
                  value={detectedColumn}
                />
              ))}
            </Select>
          </div>
        ),
        license: (
          <div className="w-full">
            <Select
              id={`license.${column.name}`}
              invalid={column.name in (errors.license ?? {})}
              labelText=""
              {...register(`license.${column.name}`, {
                validate: (value, formValues) =>
                  !!value && !!formValues.mapping[column.name],
                disabled: !watch(`mapping.${column.name}`),
                deps: [`mapping.${column.name}`],
              })}
            >
              <SelectItem text="" value="" />
              {licenseOptions.map(license => (
                <SelectItem key={license} text={license} value={license} />
              ))}
            </Select>
          </div>
        ),
      }));

  return (
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
          {isLoading ? (
            <DataTableSkeleton headers={headers} />
          ) : (
            <DataTable columns={headers} rows={rows} />
          )}
        </section>
        <Suspense>
          <ReactHookFormDevTools control={control as unknown as Control} />
        </Suspense>

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
  );
}
