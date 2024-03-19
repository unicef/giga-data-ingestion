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
  CoverageSchema,
  DataRelevanceEnum,
  MasterSchemaItem,
  coverageSchemaData,
} from "@/constants/school-data";
import { useStore } from "@/context/store";

export const Route = createFileRoute(
  "/upload/$uploadGroup/$uploadType/column-mapping",
)({
  component: ColumnMapping,
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
  { key: "masterColumn", header: "Expected Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
];

export default function ColumnMapping() {
  const {
    uploadSlice,
    uploadSliceActions: {
      decrementStepIndex,
      incrementStepIndex,
      setUploadSliceState,
    },
  } = useStore();

  const { detectedColumns } = uploadSlice;

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CoverageSchema>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit: SubmitHandler<CoverageSchema> = data => {
    const dataWithNullsReplaced = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );

    setUploadSliceState({
      uploadSlice: {
        ...uploadSlice,
        columnMapping: dataWithNullsReplaced,
      },
    });

    incrementStepIndex();
    void navigate({ to: "../metadata" });
  };

  const rows = useMemo(() => {
    return (
      Object.entries(coverageSchemaData) as [
        keyof CoverageSchema,
        MasterSchemaItem,
      ][]
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
