import { useState } from "react";

import {
  DataTable,
  type DataTableHeader,
  DefinitionTooltip,
  PaginationNav,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import { type MasterSchema, masterSchemaData } from "@/constants/school-data";
import type { BasicCheck } from "@/types/upload";

const dqResultHeaders: DataTableHeader[] = [
  { key: "column", header: "Column Name" },
  { key: "assertion", header: "Assertion" },
];

interface DataQualityChecksProps {
  data: BasicCheck[];
}

const ITEMS_PER_PAGE = 10;

const BasicDataQualityCheck = ({ data }: DataQualityChecksProps) => {
  const [page, setPage] = useState(0);

  const rows = data.map(check => {
    const { assertion, column = "NO_COLUMN", description } = check;

    const columnValue = column === "" ? "NO_COLUMN" : column;

    const definition =
      masterSchemaData[columnValue as keyof MasterSchema]?.description ||
      "NO DESCRIPTION";

    return {
      id: `${assertion}-${column}`,
      column: (
        <div className="min-w-64">
          <DefinitionTooltip align="right" definition={definition} openOnHover>
            {columnValue}
          </DefinitionTooltip>
        </div>
      ),
      assertion: (
        <div className="min-w-64 ">
          <DefinitionTooltip align="right" definition={description} openOnHover>
            {assertion}
          </DefinitionTooltip>
        </div>
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
                      className="bg-blue-200 "
                      colSpan={1}
                      {...getHeaderProps({ header })}
                      key={header.key}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
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
    </div>
  );
};

export default BasicDataQualityCheck;
