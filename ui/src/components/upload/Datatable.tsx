import {
  DataTable as CarbonDatatable,
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

const Datatable = ({ headers, rows }: DatatableProps) => {
  return (
    <>
      <CarbonDatatable rows={rows} headers={headers}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <Table {...getTableProps()} aria-label="sample table">
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                    <TableHeader
                      {...getHeaderProps({
                        header,
                      })}
                    >
                      <div className="p-4">{header.header}</div>
                      {header.header}
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
      </CarbonDatatable>
    </>
  );
};

export default Datatable;
