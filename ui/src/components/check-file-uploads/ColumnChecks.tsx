import { useMemo, useState } from "react";

import { ChevronDown, ChevronUp } from "@carbon/icons-react";
import {
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
import { useQuery } from "@tanstack/react-query";

import { api } from "@/api";
import { cn } from "@/lib/utils.ts";
import { Check, DataQualityCheckLabel } from "@/types/upload";
import { commaNumber } from "@/utils/number.ts";

const getLabelKey = (assertion: string, columnKey = "") =>
  `${assertion}-${columnKey}`;

const buildAssertionLabelMap = (labels: DataQualityCheckLabel[]) =>
  labels.reduce<Record<string, string>>((acc, label) => {
    acc[getLabelKey(label.assertion, label.column_key)] =
      label.ui_error_description;
    return acc;
  }, {});

export const formatAssertion = (
  assertion: string,
  columnKey: string,
  assertionLabels: Record<string, string>,
) => {
  return (
    assertionLabels[getLabelKey(assertion, columnKey)] ??
    assertionLabels[getLabelKey(assertion)] ??
    assertion.replace(/_/g, " ")
  );
};

interface ExtendedDataTableHeader extends DataTableHeader {
  sortable?: boolean;
}

interface DataQualityChecksProps {
  data: Check[];
}

const DataQualityChecks = ({ data }: DataQualityChecksProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({ key: "", direction: "ascending" });

  const { data: dataQualityCheckLabelsQuery } = useQuery({
    queryKey: ["data_quality_check_labels"],
    queryFn: api.uploads.list_data_quality_check_labels,
  });

  const assertionLabels = useMemo(
    () => buildAssertionLabelMap(dataQualityCheckLabelsQuery?.data ?? []),
    [dataQualityCheckLabelsQuery],
  );

  const handleUpSort = (key: string) => {
    setSortConfig({ key, direction: "ascending" });
  };

  const handleDownSort = (key: string) => {
    setSortConfig({ key, direction: "descending" });
  };

  const filteredAndSortedRows = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const result = rows.filter(check => {
      const searchString = searchTerm.toLowerCase();
      const columnKey = check.column === "" ? "NO_COLUMN" : check.column;
      const columnDisplay =
        columnKey === "NO_COLUMN" ? "Entire row" : columnKey;
      const assertionLabel = formatAssertion(
        check.assertion,
        check.column,
        assertionLabels,
      );
      return (
        check.column.toLowerCase().includes(searchString) ||
        check.assertion.toLowerCase().includes(searchString) ||
        columnDisplay.toLowerCase().includes(searchString) ||
        assertionLabel.toLowerCase().includes(searchString)
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
  }, [assertionLabels, data, searchTerm, sortConfig]);

  const renderSortControls = (key: string) => {
    const isActive = sortConfig.key === key;

    return (
      <div className="ml-2 flex shrink-0 flex-col">
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

    return {
      id: `${assertion}-${columnKey}`,
      column: columnDisplay,
      assertion: formatAssertion(assertion, column, assertionLabels),
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
      header: "Passed with success",
      sortable: true,
    },
    {
      key: "result_with_errors",
      header: "Rejected",
      sortable: true,
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
                        className={cn("bg-blue-50 text-gray-700")}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
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
    </div>
  );
};

export default DataQualityChecks;
