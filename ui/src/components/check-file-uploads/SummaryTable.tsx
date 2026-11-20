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
import { commaNumber } from "@/utils/number";

export interface SummaryTableColumn {
  key: string;
  header: ReactNode;
  align?: "left" | "right";
  /** Tailwind width class; any column setting it pins the table's layout. */
  widthClass?: string;
}

export interface SummaryTableGroup {
  key: string;
  title: ReactNode;
  rows: { key: string; cells: Record<string, ReactNode> }[];
}

interface SummaryTableProps {
  columns: SummaryTableColumn[];
  groups: SummaryTableGroup[];
  emptyMessage?: string;
}

export const AlertCount = ({ value }: { value: number }) => (
  <span className={cn(value > 0 && "text-red-600")}>{commaNumber(value)}</span>
);

export const SummaryTable = ({
  columns,
  groups,
  emptyMessage = "No results",
}: SummaryTableProps) => {
  const alignClass = (column: SummaryTableColumn) =>
    column.align === "right" ? "!text-right" : "text-left";

  return (
    <TableContainer>
      <Table
        size="md"
        className={cn(columns.some(c => c.widthClass) && "table-fixed")}
      >
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableHeader
                key={column.key}
                className={cn(
                  alignClass(column),
                  column.widthClass,
                  column.align === "right" &&
                    "[&_.cds--table-header-label]:!text-right",
                )}
              >
                {column.header}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
            </TableRow>
          )}
          {groups.map(group => [
            <TableRow key={`${group.key}-title`} className="bg-gray-100">
              <TableCell className="font-semibold" colSpan={columns.length}>
                {group.title}
              </TableCell>
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
