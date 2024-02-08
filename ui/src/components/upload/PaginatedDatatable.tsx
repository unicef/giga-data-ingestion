import { useState } from "react";

import {
  DataTable, // @ts-expect-error paginationNav has no typescript declaration yet
  PaginationNav,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import clsx from "clsx";

interface Header {
  key: string;
  header: string;
}

interface Row {
  id: string;
  [key: string]: string | JSX.Element;
}
interface DatatableProps {
  headers: Header[];
  rows: Row[];
}

const PaginatedDatatable = ({ headers, rows }: DatatableProps) => {
  const [currentPage, setCurrentPage] = useState<number>(0);

  const ROWS_PER_PAGE = 6;

  const maxPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const startIndex = currentPage * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const rowSlice = rows.slice(startIndex, endIndex);

  return (
    <>
      <DataTable rows={rowSlice} headers={headers} useStaticWidth={true}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                    <TableHeader
                      {...getHeaderProps({
                        header,
                      })}
                    >
                      <div
                        className={clsx("p-4", {
                          "w-60": header.key == "columnName",
                        })}
                      >
                        {header.header}
                      </div>
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow
                    {...getRowProps({
                      row,
                    })}
                  >
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
      <PaginationNav
        className="pagination-nav-right"
        itemsShown={5}
        totalItems={maxPages}
        onChange={(index: number) => setCurrentPage(index)}
      />
    </>
  );
};

export default PaginatedDatatable;
