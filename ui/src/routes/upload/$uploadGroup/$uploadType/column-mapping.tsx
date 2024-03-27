import { useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

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
import { useStore } from "@/context/store";

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
];

function UploadColumnMapping() {
  const {
    uploadSlice: { detectedColumns, columnMapping, source },
    uploadSliceActions: {
      decrementStepIndex,
      incrementStepIndex,
      setColumnMapping,
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
    formState: { errors },
  } = useForm<Record<string, string>>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: columnMapping,
  });

  const onSubmit: SubmitHandler<Record<string, string>> = data => {
    const dataWithNullsReplaced = Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => [value, key]),
    );
    setColumnMapping(dataWithNullsReplaced);
    incrementStepIndex();
    void navigate({ to: "../metadata" });
  };

  const rows = useMemo(() => {
    if (isLoading) return [];

    const schema = schemaQuery?.data ?? [];

    return schema.map(column => ({
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
            id={column.name}
            invalid={column.name in errors}
            labelText=""
            {...register(column.name, {
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
    }));
  }, [isLoading, schemaQuery?.data, errors, register, detectedColumns]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={8}>
        <section className="flex flex-col gap-8">
          <h2 className="text-[23px] capitalize">Configure Columns</h2>
          <div className="flex gap-4">
            <Tag type="red">*Required</Tag>
            <Tag type="purple">
              <div className="flex align-middle">
                <Warning />
                Important
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
