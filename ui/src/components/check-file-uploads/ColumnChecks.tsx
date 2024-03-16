import { useState } from "react";

import {
  DataTable,
  DataTableHeader,
  DefinitionTooltip,
  Link, // @ts-expect-error paginationNav has no typescript declaration yet
  PaginationNav,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import { MasterSchema, masterSchemaData } from "@/constants/school-data";
import { DataRelevanceEnum } from "@/constants/school-data";
import {
  Check,
  DqFailedRowValues,
  DqFailedRowsFirstFiveRows,
} from "@/types/upload";

import StatusIndicator from "../upload/StatusIndicator";
import ViewDetailsModal from "./ViewDetailsModal";

const dqResultHeaders: DataTableHeader[] = [
  { key: "column", header: "Column Name" },
  { key: "assertion", header: "Assertion" },
  { key: "count_failed", header: "Count Failed" },
  { key: "percent_failed", header: "Percent Failed" },
  { key: "count_passed", header: "Count Passed" },
  { key: "percent_passed", header: "Percent Passed" },
  { key: "actions", header: "Actions" },
];

interface DataQualityChecksProps {
  data: Check[];
  previewData: DqFailedRowsFirstFiveRows;
}

const ITEMS_PER_PAGE = 10;
const DataQualityChecks = ({ data, previewData }: DataQualityChecksProps) => {
  const [page, setPage] = useState(0);
  const [selectedAssertion, setSelctedAssertion] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedPreviewData, setSelectedPreviewData] = useState<
    DqFailedRowValues[]
  >([{}]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const masterSchemaDataWithMissingFields = {
    ...masterSchemaData,
    admin1_id_giga: {
      description: "NO_DESCRIPTION",
      data_relevance: DataRelevanceEnum.Optional,
    },
    admin2_id_giga: {
      description: "NO_DESCRIPTION",
      data_relevance: DataRelevanceEnum.Optional,
    },
    nearest_NR_distance: {
      description: "NO_DESCRIPTION",
      data_relevance: DataRelevanceEnum.Optional,
    },
    nearest_NR_id: {
      description: "NO_DESCRIPTION",
      data_relevance: DataRelevanceEnum.Optional,
    },
  };

  const rows = data
    .sort((a, b) => {
      if (a.column < b.column) {
        return -1;
      }
      if (a.column > b.column) {
        return 1;
      }
      return 0;
    })
    .map(check => {
      const {
        assertion,
        column = "NO_COLUMN",
        description,
        count_failed,
        count_passed,
        count_overall,
        percent_failed,
        percent_passed,
      } = check;

      const columnValue = column === "" ? "NO_COLUMN" : column;

      const definition =
        masterSchemaDataWithMissingFields[columnValue as keyof MasterSchema]
          ?.description || "NO DESCRIPTION";

      return {
        id: `${assertion}-${column}`,
        column: (
          <div className="min-w-64">
            <DefinitionTooltip
              align="right"
              definition={definition}
              openOnHover
            >
              {columnValue}
            </DefinitionTooltip>
          </div>
        ),
        assertion: (
          <div className="min-w-64 ">
            <DefinitionTooltip
              align="right"
              definition={description}
              openOnHover
            >
              {assertion}
            </DefinitionTooltip>
          </div>
        ),
        count_failed: (
          <div className="flex">
            {count_failed}/{count_overall}
          </div>
        ),
        percent_failed: (
          <div className="flex">
            <StatusIndicator className="mr-1" type="error" />
            {percent_failed}%
          </div>
        ),
        count_passed: (
          <div className="flex">
            {count_passed}/{count_overall}
          </div>
        ),
        percent_passed: (
          <div className="flex">
            <StatusIndicator className="mr-1" type="success" />
            {percent_passed}%
          </div>
        ),
        actions: (
          <Link
            className="cursor-pointer"
            onClick={() => {
              const dfasdf = previewData[`${assertion}-${column}`];

              setSelctedAssertion(assertion);
              setSelectedPreviewData(dfasdf);
              setIsModalOpen(true);
              setSelectedColumn(column);
            }}
          >
            View Details
          </Link>
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
