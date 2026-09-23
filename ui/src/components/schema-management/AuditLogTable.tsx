import { useMemo, useState } from "react";

import {
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";

import { listSchemaAuditLogQueryOptions } from "@/api/queryOptions.ts";

const columns: DataTableHeader[] = [
  { key: "created", header: "When" },
  { key: "action", header: "Action" },
  { key: "dataset_key", header: "Dataset" },
  { key: "column_name", header: "Column" },
  { key: "actor_email", header: "Actor" },
];

function AuditLogTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading } = useQuery(
    listSchemaAuditLogQueryOptions({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  );

  const logs = useMemo(() => data?.data ?? [], [data]);

  const rows = logs.map(log => ({
    id: log.id,
    created: new Date(log.created).toLocaleString(),
    action: log.action,
    dataset_key: log.dataset_key ?? "",
    column_name: log.column_name ?? "",
    actor_email: log.actor_email,
  }));

  return isLoading ? (
    <DataTableSkeleton headers={columns} />
  ) : (
    <>
      <DataTable headers={columns} rows={rows}>
        {({
          rows: tableRows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
        }) => (
          <TableContainer title="Audit log">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                    <TableHeader {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map(row => (
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
      <Pagination
        page={page}
        pageSize={pageSize}
        pageSizes={[10, 25, 50]}
        // The API doesn't return a total count — infer whether a next page
        // exists from whether this page came back full.
        totalItems={
          logs.length === pageSize ? page * pageSize + 1 : page * pageSize
        }
        onChange={({ page: newPage, pageSize: newPageSize }) => {
          setPage(newPage);
          setPageSize(newPageSize);
        }}
      />
    </>
  );
}

export default AuditLogTable;
