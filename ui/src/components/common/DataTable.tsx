import { ComponentProps } from "react";

import {
  DataTable as CarbonDataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

export interface DataTableProps {
  columns: ComponentProps<typeof CarbonDataTable>["headers"];
  rows: ComponentProps<typeof CarbonDataTable>["rows"];
}

function DataTable({ columns, rows }: DataTableProps) {
  return (
    <CarbonDataTable headers={columns} rows={rows}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map(header => (
                  // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                  <TableHeader colSpan={1} {...getHeaderProps({ header })}>
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
    </CarbonDataTable>
  );
}

export default DataTable;
