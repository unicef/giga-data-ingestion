import { ReactElement, useMemo, useState } from "react";

import {
  Button,
  DataTableHeader,
  DataTableSkeleton,
  Section,
  TableContainer,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { SENTINEL_PAGED_RESPONSE } from "@/types/api.ts";
import { ApprovalRequestListing } from "@/types/approvalRequests";

export const Route = createFileRoute("/approval-requests/")({
  component: ApprovalRequests,
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const { data, isLoading } = useQuery({
    queryKey: ["approvalRequests", page, pageSize],
    queryFn: () => api.approvalRequests.list({ page, page_size: pageSize }),
  });
  const approvalRequests = data?.data ?? SENTINEL_PAGED_RESPONSE;

  const formattedApprovalRequests = useMemo<ApprovalRequest[]>(
    () =>
      approvalRequests.data.map(request => ({
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
      {isLoading ? (
        <DataTableSkeleton headers={columns} />
      ) : (
        <TableContainer title="Approval Requests">
          <DataTable
            columns={columns}
            rows={formattedApprovalRequests}
            isPaginated
            count={approvalRequests.total_count}
            handlePaginationChange={handlePaginationChange}
            page={approvalRequests.page}
            pageSize={approvalRequests.page_size}
          />
        </TableContainer>
      )}
    </Section>
  );
}
