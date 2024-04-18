import { ReactElement, useMemo, useState } from "react";

import {
  Button,
  DataTableHeader,
  DataTableSkeleton,
  Section,
} from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import { listApprovalRequestQueryOptions } from "@/api/queryOptions";
import DataTable from "@/components/common/DataTable.tsx";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { useStore } from "@/context/store";
import { SENTINEL_PAGED_RESPONSE } from "@/types/api.ts";
import { ApprovalRequestListing } from "@/types/approvalRequests";

export const Route = createFileRoute("/approval-requests/")({
  component: ApprovalRequests,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listApprovalRequestQueryOptions),
});

const columns: DataTableHeader[] = [
  {
    key: "country",
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

type ApprovalRequestTableRow = Record<
  keyof ApprovalRequestListing,
  string | number | null | ReactElement
>;

function ApprovalRequests() {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const {
    approveRowActions: { resetApproveRowState },
  } = useStore();

  function handlePaginationChange({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) {
    setPage(page);
    setPageSize(pageSize);
  }

  const { data, isLoading } = useSuspenseQuery(
    queryOptions({
      queryKey: ["approval-requests", page, pageSize],
      queryFn: () =>
        api.approvalRequests.list({
          page: page,
          page_size: pageSize,
        }),
    }),
  );

  const approvalRequests = data?.data ?? SENTINEL_PAGED_RESPONSE;

  const formattedApprovalRequests = useMemo<ApprovalRequestTableRow[]>(
    () =>
      approvalRequests.data.map(request => ({
        ...request,
        country: `${request.country} (${request.country_iso3})`,
        actions: (
          <Button
            kind="ghost"
            size="sm"
            as={Link}
            to="./$subpath"
            params={{
              subpath: encodeURIComponent(request.subpath),
            }}
            onClick={() => resetApproveRowState()}
          >
            Approve Rows
          </Button>
        ),
        last_modified: format(
          new Date(request.last_modified),
          DEFAULT_DATETIME_FORMAT,
        ),
      })),
    [approvalRequests, resetApproveRowState],
  );

  return (
    <Section className="container flex flex-col gap-4 py-6">
      {isLoading ? (
        <DataTableSkeleton headers={columns} />
      ) : (
        <DataTable
          title="Approval Requests"
          columns={columns}
          rows={formattedApprovalRequests}
          isPaginated
          count={approvalRequests.total_count}
          handlePaginationChange={handlePaginationChange}
          page={approvalRequests.page}
          pageSize={approvalRequests.page_size}
        />
      )}
    </Section>
  );
}
