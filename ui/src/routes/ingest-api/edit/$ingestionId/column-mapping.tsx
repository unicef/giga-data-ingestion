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
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import {
  DataRelevanceEnum,
  ISchoolData,
  SchoolDataItem,
  schoolData,
} from "@/constants/school-data";
import { useStore } from "@/context/store";

export const Route = createFileRoute(
  "/ingest-api/edit/$ingestionId/column-mapping",
)({
  component: ColumnMapping,
  loader: () => {
    const {
      schoolList: { api_endpoint },
    } = useStore.getState().apiIngestionSlice;

    if (api_endpoint === "") throw redirect({ to: ".." });
  },
});

const headers: DataTableHeader[] = [
  { key: "masterColumn", header: "Expected Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
];

function ColumnMapping() {
  const {
    apiIngestionSlice: { detectedColumns },
    apiIngestionSliceActions: {
      decrementStepIndex,
      incrementStepIndex,
      setColumnMapping,
    },
  } = useStore();

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ISchoolData>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit: SubmitHandler<ISchoolData> = data => {
    incrementStepIndex();
    const updatedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );

    setColumnMapping(updatedData);
    void navigate({ to: "../school-connectivity" });
  };

  const rows = useMemo(() => {
    return (
      Object.entries(schoolData) as [keyof ISchoolData, SchoolDataItem][]
    ).map(([key, schoolDataItem]) => {
      const { data_relevance, description } = schoolDataItem;

      return {
        id: key,
        masterColumn: (
          <div className="flex items-center gap-4">
            <DefinitionTooltip
              align="right"
              definition={description}
              openOnHover
            >
              {key}
              {data_relevance === DataRelevanceEnum.Required && (
                <span className="text-giga-red">*</span>
              )}
              {data_relevance === DataRelevanceEnum.Important && (
                <span className="text-purple-600">{" (!)"}</span>
              )}
            </DefinitionTooltip>
          </div>
        ),
        detectedColumns: (
          <div className="w-11/12 px-2 pb-2">
            <Select
              id={`${key}-mapping`}
              invalid={key in errors}
              labelText=""
              {...register(key, {
                required: data_relevance === DataRelevanceEnum.Required,
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
  }, [errors, register, detectedColumns]);

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
