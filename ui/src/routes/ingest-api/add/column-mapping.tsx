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

import { useQosStore } from "@/context/qosStore";
import { MasterColumnMapping } from "@/types/qos";

export const Route = createFileRoute("/ingest-api/add/column-mapping")({
  component: ColumnMapping,
  loader: () => {
    // remove return after testing
    return;
    const { stepIndex } = useQosStore.getState();
    if (stepIndex) throw redirect({ to: ".." });
  },
});

const headers: DataTableHeader[] = [
  { key: "masterColumn", header: "Expected Columns" },
  { key: "detectedColumns", header: "Detected Columns" },
];

const mockDetectedColumns = ["num_stud", "id", "latitud", "long"];
const masterColumns = [
  { name: "school_id", description: "school id description" },
  { name: "student_count", description: "student_count description" },
  { name: "lat", description: "lat  description" },
  { name: "long", description: "long description" },
];

type MasterColumnMappingKeys = keyof MasterColumnMapping;

function ColumnMapping() {
  const { incrementStepIndex, decrementStepIndex, setColumnMapping } =
    useQosStore();

  const navigate = useNavigate({ from: Route.fullPath });

  const { handleSubmit, register } = useForm<MasterColumnMapping>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  //memoize this

  const rows = useMemo(() => {
    return masterColumns.map(masterColumn => {
      const { name, description } = masterColumn;

      return {
        id: name,
        masterColumn: (
          <DefinitionTooltip align="right" definition={description} openOnHover>
            {masterColumn.name}
          </DefinitionTooltip>
        ),
        detectedColumns: (
          <div className="w-11/12 px-2 pb-2">
            <Select
              id={`${name}-mapping`}
              labelText=""
              {...register(name as MasterColumnMappingKeys)}
            >
              <SelectItem text="" value="" />
              {mockDetectedColumns.map(detectedColumn => (
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
  }, [register]);

  const handleOnClick = () => {
    console.log("dasd");
  };

  const onSubmit: SubmitHandler<MasterColumnMapping> = data => {
    incrementStepIndex();
    setColumnMapping({ ...data });
    console.log("NAVIGATOR");
    void navigate({ to: "../school-connectivity" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div onClick={handleOnClick}>CLick mer</div>
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
