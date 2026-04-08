import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { errorTableSummaryQueryOptions } from "@/api/queryOptions";

const HEADERS = [
  { key: "country_code", header: "Country" },
  { key: "dataset_type", header: "Dataset Type" },
  { key: "error_count", header: "Error Count" },
  { key: "distinct_files", header: "Distinct Files" },
];

export default function ErrorSummary() {
  const { data: summaryResponse } = useSuspenseQuery(
    errorTableSummaryQueryOptions,
  );
  const summaryData = summaryResponse.data.data;

  const rows = summaryData.map((item, index) => ({
    id: `${item.country_code}-${item.dataset_type}-${index}`,
    ...item,
  }));

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold">Error Summary</h3>
      <DataTable headers={HEADERS} rows={rows}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type
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
    </div>
  );
}
