import { ComponentProps } from "react";

import {
  DataTable as CarbonDataTable,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

interface _DataTableProps extends ComponentProps<typeof CarbonDataTable> {
  columns: ComponentProps<typeof CarbonDataTable>["headers"];
  rows: ComponentProps<typeof CarbonDataTable>["rows"];
  size?: ComponentProps<typeof CarbonDataTable>["size"];
  title?: string;
  pageSizes?: number[];
  columnWidths?: string[];
}

export type DataTableProps = _DataTableProps &
  (
    | {
        isPaginated: true;
        count: number;
        handlePaginationChange: ({
          page,
          pageSize,
        }: {
          page: number;
          pageSize: number;
        }) => void;
        page: number;
        pageSize: number;
        columnWidths?: string[];
      }
    | {
        isPaginated?: false;
        count?: never;
        handlePaginationChange?: never;
        page?: never;
        pageSize?: never;
        columnWidths?: string[];
      }
  );

function DataTable({
  columns,
  rows,
  size,
  count,
  title = "",
  isPaginated = false,
  pageSize,
  page,
  pageSizes = [10, 25, 50],
  handlePaginationChange,
  columnWidths,
}: DataTableProps) {
  return (
    <CarbonDataTable headers={columns} rows={rows} size={size}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer title={title}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                  <TableHeader
                    colSpan={1}
                    {...getHeaderProps({ header })}
                    style={
                      columnWidths && columnWidths[index]
                        ? { width: columnWidths[index] }
                        : undefined
                    }
                  >
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      style={
                        columnWidths && columnWidths[index]
                          ? { width: columnWidths[index] }
                          : undefined
                      }
                    >
                      {cell.value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {isPaginated && (
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={pageSizes}
              totalItems={count}
              onChange={handlePaginationChange}
            />
          )}
        </TableContainer>
      )}
    </CarbonDataTable>
  );
}

export default DataTable;
