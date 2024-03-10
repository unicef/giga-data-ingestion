import { ReactElement, useMemo } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  Heading,
  Section,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { api, queryClient } from "@/api";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { ApprovalRequestListing } from "@/types/approvalRequests.ts";

const listQueryOptions = queryOptions({
  queryKey: ["approval-requests"],
  queryFn: api.approvalRequests.list,
});

export const Route = createFileRoute("/approval-requests/")({
  component: ApprovalRequests,
  loader: async () => {
    return queryClient.ensureQueryData(listQueryOptions);
  },
});

const columns: DataTableHeader[] = [
  {
    key: "id",
    header: "Country",
  },
  {
    key: "dataset",
    header: "Dataset",
  },
  {
    key: "last_modified",
    header: "Last Modified",
  },
  {
    key: "rows_count",
    header: "Row Count",
  },
  {
    key: "rows_added",
    header: "Rows Added",
  },
  {
    key: "rows_updated",
    header: "Rows Updated",
  },
  {
    key: "actions",
    header: "",
  },
];

type ApprovalRequest = Record<
  keyof ApprovalRequestListing,
  string | number | null | ReactElement
> & { id: string; actions: ReactElement };

function ApprovalRequests() {
  const {
    data: { data: approvalRequests },
  } = useSuspenseQuery(listQueryOptions);

  const formattedApprovalRequests: ApprovalRequest[] = useMemo(
    () =>
      approvalRequests.map(request => ({
        ...request,
        id: `${request.country} (${request.country_iso3})`,
        actions: (
          <Button kind="ghost" size="sm">
            Approve Rows
          </Button>
        ),
        last_modified: format(
          new Date(request.last_modified),
          DEFAULT_DATETIME_FORMAT,
        ),
      })),
    [approvalRequests],
  );

  return (
    <Section className="container flex flex-col gap-4 py-6">
      <Section>
        <Heading>Approval Requests</Heading>
      </Section>

      <DataTable headers={columns} rows={formattedApprovalRequests}>
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
      </DataTable>
    </Section>
  );
}
