import { useMemo, useState } from "react";

import {
  CheckmarkFilled,
  ChevronDown,
  ChevronUp,
  WarningFilled,
} from "@carbon/icons-react";
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

export const ASSERTION_LABELS: Record<string, string> = {
  // Null / missing value checks
  is_null_mandatory: "Required column is empty",
  is_null_optional: "Column has no value",

  // Create vs. update existence checks
  is_not_update: "School already exists — could not create a duplicate record",
  is_not_create: "School not found in system — could not apply the update",

  // Duplicate checks
  duplicate: "Duplicate value detected",
  duplicate_all_except_school_code:
    "Potential duplicate record (all columns match except school ID)",
  duplicate_set: "Duplicate location (same coordinates as another school)",
  duplicate_name_level_within_110m_radius:
    "Same school name and education level within 110m of another school",
  duplicate_similar_name_same_level_within_110m_radius:
    "Similar school name and same education level within 110m",
  duplicate_within_110m_radius:
    "Another school already exists within a 110m radius",
  duplicate_50_flag: "Another school exists within 50 meters",
  duplicate_50_count: "Number of nearby schools within 50 meters",
  duplicate_50_group_id: "Nearby schools group identifier (50m radius)",

  // Location / geospatial checks
  is_not_within_country: "Coordinates fall outside the country's boundaries",
  uninhabited: "School location is in an uninhabited area",
  is_school_density_greater_than_5:
    "High school density: 5 or more schools found within ~500m",
  precision: "Coordinate has fewer than 5 decimal places (low precision)",

  // Domain / categorical checks
  is_invalid_domain: "Value is not in the list of allowed options",

  // Range / numeric checks
  is_invalid_range: "Value is outside the expected numeric range",
  is_not_numeric: "Value must be a number",
  is_not_alphanumeric: "Value contains invalid characters",
};

export const formatAssertion = (assertion: string) =>
  ASSERTION_LABELS[assertion] ?? assertion.replace(/_/g, " ");

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
      column = "",
      count_failed,
      count_passed,
      percent_passed,
    } = check;

    const columnKey = column === "" ? "NO_COLUMN" : column;
    const columnDisplay = columnKey === "NO_COLUMN" ? "Entire row" : columnKey;
    const canViewDetails = count_failed > 0 && columnKey !== "NO_COLUMN";

    return {
      id: `${assertion}-${columnKey}`,
      column: columnDisplay,
      assertion: formatAssertion(assertion),
      result_with_errors: (
        <div className="flex items-center">
          {count_failed > 0 ? (
            <span className="mr-2 font-medium text-red-600">
              {commaNumber(count_failed)}
            </span>
          ) : (
            <span className="mr-2 font-medium text-green-600">0</span>
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
          disabled={!canViewDetails}
          title={
            canViewDetails
              ? "View rows with errors"
              : count_failed === 0
              ? "No errors found"
              : "Row-level check — no column details available"
          }
          onClick={() => {
            const selectedPreviewData =
              previewData[`${assertion}-${column}`] || INVALID_VALUES;

            setSelectedAssertion(assertion);
            setSelectedPreviewData(selectedPreviewData);
            setIsModalOpen(true);
            setSelectedColumn(column);
          }}
        >
          {count_failed > 0 ? (
            <WarningFilled
              className={cn({
                "text-red-600": canViewDetails,
                "text-red-300": !canViewDetails,
              })}
            />
          ) : (
            <CheckmarkFilled className="text-green-600" />
          )}
        </Button>
      ),
    };
  });

  const dqResultHeaders: ExtendedDataTableHeader[] = [
    {
      key: "column",
      header: "Column",
      sortable: false,
    },
    {
      key: "assertion",
      header: "Check Description",
      sortable: false,
    },
    {
      key: "passed_without_errors",
      header: "Passed",
      sortable: true,
    },
    {
      key: "result_with_errors",
      header: "Failed",
      sortable: true,
    },
    {
      key: "actions",
      header: "View Errors",
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
            Overview of all checks sorted by type
          </h3>
        </div>

        <DataTable headers={dqResultHeaders} rows={rows}>
          {({ rows, headers, getRowProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map(header => (
                      <TableHeader
                        key={header.key}
                        isSortable={false}
                        className={cn("relative bg-blue-50 text-gray-700")}
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
