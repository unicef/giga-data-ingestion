import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";

import { ProposalDiffField } from "@/types/schemaRegistry.ts";

interface DiffViewerProps {
  diff: ProposalDiffField[];
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function DiffViewer({ diff }: DiffViewerProps) {
  if (diff.length === 0) {
    return <p className="text-giga-dark-gray">No field changes.</p>;
  }

  return (
    <Table size="sm">
      <TableHead>
        <TableRow>
          <TableHeader>Field</TableHeader>
          <TableHeader>Before</TableHeader>
          <TableHeader>After</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {diff.map(field => (
          <TableRow key={field.field}>
            <TableCell>{field.field}</TableCell>
            <TableCell className="bg-giga-light-red text-giga-dark-red">
              {formatValue(field.before)}
            </TableCell>
            <TableCell className="bg-giga-light-green text-giga-dark-green">
              {formatValue(field.after)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default DiffViewer;
