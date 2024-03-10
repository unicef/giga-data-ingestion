import { ReactElement, useMemo } from "react";

import { Button, DataTableHeader, Heading, Section } from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { api, queryClient } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { ApprovalRequestListing } from "@/types/approvalRequests.ts";

const listQueryOptions = queryOptions({
  queryKey: ["approval-requests"],
  queryFn: api.approvalRequests.list,
});

export const Route = createFileRoute("/approval-requests/")({
  component: ApprovalRequests,
  loader: () => {
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
          <Button
            kind="ghost"
            size="sm"
            as={Link}
            to="./$subpath"
            params={{
              subpath: encodeURIComponent(request.subpath),
            }}
          >
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

      <DataTable columns={columns} rows={formattedApprovalRequests} />
    </Section>
  );
}
