import { useMemo, useState } from "react";

import { ChevronDown, ChevronUp, Warning } from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableHeader,
  Search,
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

interface ExtendedDataTableHeader extends DataTableHeader {
  sortable?: boolean;
}

interface DataQualityChecksProps {
  data: Check[];
  previewData: DqFailedRowsFirstFiveRows;
}

const INVALID_VALUES = [
  {
    name: "invalid",
    errorMessage: "The values of these columns seem to be invalid",
  },
];

const DataQualityChecks = ({ data, previewData }: DataQualityChecksProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({ key: "", direction: "ascending" });

  const [selectedAssertion, setSelectedAssertion] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedPreviewData, setSelectedPreviewData] = useState<
    DqFailedRowValues[]
  >([{}]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleUpSort = (key: string) => {
    setSortConfig({ key, direction: "ascending" });
  };

  const handleDownSort = (key: string) => {
    setSortConfig({ key, direction: "descending" });
  };

  const filteredAndSortedRows = useMemo(() => {
    const result = data.filter(check => {
      const searchString = searchTerm.toLowerCase();
      return (
        check.column.toLowerCase().includes(searchString) ||
        check.assertion.toLowerCase().includes(searchString)
      );
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        switch (sortConfig.key) {
          case "passed_without_errors":
            aValue = a.count_passed;
            bValue = b.count_passed;
            break;
          case "records_with_errors":
            aValue = a.percent_passed;
            bValue = b.percent_passed;
            break;
          case "result_with_errors":
            aValue = a.count_failed;
            bValue = b.count_failed;
            break;
          default:
            return 0;
        }

        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const renderSortControls = (key: string) => {
    const isActive = sortConfig.key === key;

    return (
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 flex-col">
        <ChevronUp
          className={cn(
            "cursor-pointer transition-colors duration-150",
            isActive && sortConfig.direction === "ascending"
              ? "text-blue-600"
              : "text-gray-400 hover:text-gray-600",
          )}
          size={16}
          onClick={() => handleUpSort(key)}
        />
        <ChevronDown
          className={cn(
            "cursor-pointer transition-colors duration-150",
            isActive && sortConfig.direction === "descending"
              ? "text-blue-600"
              : "text-gray-400 hover:text-gray-600",
          )}
          size={16}
          onClick={() => handleDownSort(key)}
        />
      </div>
    );
  };

  const rows = filteredAndSortedRows.map(check => {
    const {
      assertion,
      column = "NO_COLUMN",
      count_failed,
      count_passed,
      percent_passed,
    } = check;

    const columnKey = column === "" ? "NO_COLUMN" : column;

    return {
      id: `${assertion}-${columnKey}`,
      column: columnKey,
      assertion,
      result_with_errors: (
        <div className="flex items-center">
          {count_failed > 0 ? (
            <span className="mr-2 text-red-600">
              {commaNumber(count_failed)}
            </span>
          ) : (
            <span className="mr-2 text-green-600">0</span>
          )}
        </div>
      ),
      passed_without_errors: commaNumber(count_passed),
      records_with_errors: (
        <div
          className={cn("flex", {
            "text-red-600": count_failed > 0,
            "text-green-600": count_failed === 0,
          })}
        >
          {count_failed > 0 ? `${percent_passed.toFixed(2)}%` : "100%"}
        </div>
      ),
      actions: (
        <Button
          className="cursor-pointer"
          kind="ghost"
          disabled={columnKey === "NO_COLUMN" || percent_passed === 100}
          onClick={() => {
            const selectedPreviewData =
              previewData[`${assertion}-${column}`] || INVALID_VALUES;

            setSelectedAssertion(assertion);
            setSelectedPreviewData(selectedPreviewData);
            setIsModalOpen(true);
            setSelectedColumn(column);
          }}
        >
          <Warning className="text-red-600" />
        </Button>
      ),
    };
  });

  const dqResultHeaders: ExtendedDataTableHeader[] = [
    {
      key: "column",
      header: "Column(s)",
      sortable: false,
    },
    {
      key: "assertion",
      header: "Validation Rule",
      sortable: false,
    },
    {
      key: "passed_without_errors",
      header: "Passed with success",
      sortable: true,
    },
    {
      key: "result_with_errors",
      header: "Rejected",
      sortable: true,
    },
    {
      key: "records_with_errors",
      header: "Records with Errors",
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <Search
          labelText="Search columns and validation rules"
          placeholder="Search columns and validation rules"
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Overview of all fields sorted by type
          </h3>
        </div>

        <DataTable headers={dqResultHeaders} rows={rows}>
          {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map(header => (
                      <TableHeader
                        className={cn("relative bg-blue-50 text-gray-700")}
                        {...getHeaderProps({ header })}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span>{header.header}</span>
                          {(header as ExtendedDataTableHeader).sortable &&
                            renderSortControls(header.key)}
                        </div>
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
      </div>

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
