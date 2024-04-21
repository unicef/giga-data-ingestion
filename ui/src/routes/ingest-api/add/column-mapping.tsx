import { useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ArrowLeft, ArrowRight, Warning } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  DataTable,
  DataTableHeader,
  DefinitionTooltip,
  Select,
  SelectItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import { api } from "@/api";
import { useStore } from "@/context/store";
import { ConfigureColumnsForm } from "@/forms/ingestApi.ts";

const schemaQueryOptions = queryOptions({
  queryFn: () => api.schema.get("school_geolocation"),
  queryKey: ["schema", "school_geolocation"],
});

export const Route = createFileRoute("/ingest-api/add/column-mapping")({
  component: ColumnMapping,
  loader: ({ context: { queryClient } }) => {
    const {
      apiIngestionSlice: { detectedColumns },
      apiIngestionSliceActions: { setStepIndex },
    } = useStore.getState();

    if (detectedColumns.length === 0) {
      setStepIndex(0);
      throw redirect({ to: ".." });
    }

    setStepIndex(1);

    return queryClient.ensureQueryData(schemaQueryOptions);
  },
});

const headers: DataTableHeader[] = [
  { key: "masterColumn", header: "Expected Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
];

function ColumnMapping() {
  const {
    apiIngestionSlice: { detectedColumns, columnMapping },
    apiIngestionSliceActions: {
      incrementStepIndex,
      decrementStepIndex,
      setColumnMapping,
    },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: { data: schema },
  } = useSuspenseQuery(schemaQueryOptions);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ConfigureColumnsForm>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: columnMapping,
  });

  const onSubmit: SubmitHandler<ConfigureColumnsForm> = data => {
    incrementStepIndex();
    setColumnMapping(data);
    void navigate({ to: "/ingest-api/add/school-connectivity" });
  };

  const rows = useMemo(() => {
    return schema.map(column => {
      return {
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
      };
    });
  }, [schema, errors, register, detectedColumns]);

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
          <DataTable headers={headers} rows={rows}>
            {({
              rows,
              headers,
              getHeaderProps,
              getRowProps,
              getTableProps,
            }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map(header => (
                        // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                        <TableHeader {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow {...getRowProps({ row })}>
                        {row.cells.map(cell => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
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
