import { useState } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  PaginationNav,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import { cn } from "@/lib/utils.ts";
import {
  Check,
  DqFailedRowValues,
  DqFailedRowsFirstFiveRows,
} from "@/types/upload";
import { commaNumber } from "@/utils/number.ts";

import ViewDetailsModal from "./ViewDetailsModal";

const dqResultHeaders: DataTableHeader[] = [
  { key: "description", header: "Check" },
  { key: "count_failed", header: "Count Failed" },
  { key: "actions", header: "Actions" },
];

interface DataQualityChecksProps {
  data: Check[];
  previewData: DqFailedRowsFirstFiveRows;
}

const ITEMS_PER_PAGE = 10;

const INVALID_VALUES = [
  {
    name: "invalid",
    errorMessage: "the values of these columns seem to be invalid",
  },
];

const DataQualityChecks = ({ data, previewData }: DataQualityChecksProps) => {
  const [page, setPage] = useState(0);
  const [selectedAssertion, setSelctedAssertion] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedPreviewData, setSelectedPreviewData] = useState<
    DqFailedRowValues[]
  >([{}]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const rows = data.map(check => {
    const {
      assertion,
      column = "NO_COLUMN",
      description,
      count_failed,
      count_overall,
      percent_passed,
    } = check;

    const columnValue = column === "" ? "NO_COLUMN" : column;

    return {
      id: `${assertion}-${column}`,
      description: <div className="min-w-64">{description}</div>,
      count_failed: (
        <div
          className={cn("flex", {
            "text-giga-dark-red": count_failed > 0,
          })}
        >
          {commaNumber(count_failed)}/{commaNumber(count_overall)}
        </div>
      ),
      actions: (
        <Button
          className="cursor-pointer"
          kind="ghost"
          disabled={columnValue === "NO_COLUMN" || percent_passed === 100}
          onClick={() => {
            const selectedPreviewData =
              previewData[`${assertion}-${column}`] || INVALID_VALUES;

            setSelctedAssertion(assertion);
            setSelectedPreviewData(selectedPreviewData);
            setIsModalOpen(true);
            setSelectedColumn(column);
          }}
        >
          View Error rows
        </Button>
      ),
    };
  });

  const maxPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = page * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const rowSlice = rows.slice(startIndex, endIndex);

  return (
    <div>
      <DataTable headers={dqResultHeaders} rows={rowSlice}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                    <TableHeader
                      className="bg-blue-200  "
                      colSpan={1}
                      {...getHeaderProps({ header })}
                    >
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
            <PaginationNav
              itemsShown={ITEMS_PER_PAGE}
              totalItems={maxPages}
              onChange={(index: number) => setPage(index)}
            />
          </TableContainer>
        )}
      </DataTable>
      <ViewDetailsModal
        assertion={selectedAssertion}
        column={selectedColumn}
        previewData={selectedPreviewData}
        open={isModalOpen}
        setOpen={setIsModalOpen}
      />
    </div>
  );
};

export default DataQualityChecks;
