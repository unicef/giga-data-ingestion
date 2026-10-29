import { ReactNode } from "react";

import {
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import { cn } from "@/lib/utils";

export interface SummaryTableColumn {
  key: string;
  header: ReactNode;
  align?: "left" | "right";
}

export interface SummaryTableGroup {
  key: string;
  title: ReactNode;
  /** Repeats the column headers on the group row, as in the per-column view. */
  showColumnHeaders?: boolean;
  rows: { key: string; cells: Record<string, ReactNode> }[];
}

interface SummaryTableProps {
  columns: SummaryTableColumn[];
  groups: SummaryTableGroup[];
  hideHeader?: boolean;
  emptyMessage?: string;
}

export const SummaryTable = ({
  columns,
  groups,
  hideHeader = false,
  emptyMessage = "No results",
}: SummaryTableProps) => {
  const alignClass = (column: SummaryTableColumn) =>
    column.align === "right" ? "!text-right" : "text-left";

  return (
    <TableContainer>
      <Table size="md">
        {!hideHeader && (
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableHeader
                  key={column.key}
                  className={cn(
                    alignClass(column),
                    column.align === "right" &&
                      "[&_.cds--table-header-label]:!text-right",
                  )}
                >
                  {column.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {groups.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
            </TableRow>
          )}
          {groups.map(group => [
            <TableRow key={`${group.key}-title`} className="bg-gray-100">
              <TableCell
                className="font-semibold"
                colSpan={group.showColumnHeaders ? 1 : columns.length}
              >
                {group.title}
              </TableCell>
              {group.showColumnHeaders &&
                columns.slice(1).map(column => (
                  <TableCell
                    key={column.key}
                    className={cn("font-semibold", alignClass(column))}
                  >
                    {column.header}
                  </TableCell>
                ))}
            </TableRow>,
            ...group.rows.map(row => (
              <TableRow key={`${group.key}-${row.key}`}>
                {columns.map(column => (
                  <TableCell key={column.key} className={alignClass(column)}>
                    {row.cells[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            )),
          ])}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface SummarySearchProps {
  onChange: (value: string) => void;
}

export const SummarySearch = ({ onChange }: SummarySearchProps) => (
  <div className="mb-4">
    <Search
      size="lg"
      labelText="Search"
      placeholder="Search"
      onChange={e => onChange(e.target.value)}
    />
  </div>
);
