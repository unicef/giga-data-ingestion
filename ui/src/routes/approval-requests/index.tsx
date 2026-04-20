import { ReactElement, useMemo } from "react";

import { Button, DataTableHeader, DataTableSkeleton } from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { useStore } from "@/context/store";
import { SENTINEL_PAGED_RESPONSE } from "@/types/api.ts";
import { CountryPendingListing } from "@/types/approvalRequests";
import { commaNumber } from "@/utils/number.ts";
import { validateSearchParams } from "@/utils/pagination.ts";

const columns: DataTableHeader[] = [
  { key: "country", header: "Country" },
  { key: "pending_uploads", header: "Pending Uploads" },
  { key: "rows_added", header: "Rows to Add" },
  { key: "rows_updated", header: "Rows to Update" },
  { key: "rows_deleted", header: "Rows to Delete" },
  { key: "actions", header: "" },
];

export const Route = createFileRoute("/approval-requests/")({
  component: ApprovalRequests,
  validateSearch: validateSearchParams,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["approval-requests", 1, 10],
        queryFn: () =>
          api.approvalRequests.listCountries({ page: 1, page_size: 10 }),
      }),
    ),
  pendingComponent: () => <DataTableSkeleton headers={columns} />,
  errorComponent: () => (
    <DataTable title="Approval Requests" columns={columns} rows={[]} />
  ),
});

type CountryTableRow = Partial<
  Record<
    keyof CountryPendingListing,
    string | number | boolean | undefined | ReactElement
  >
> & { id: string; actions: ReactElement };

function ApprovalRequests() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page = 1, page_size = 10 } = Route.useSearch();
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
    void navigate({ to: "", search: { page, page_size: pageSize } });
  }

  const { data, isFetching, isRefetching } = useSuspenseQuery(
    queryOptions({
      queryKey: ["approval-requests", page, page_size],
      queryFn: () => api.approvalRequests.listCountries({ page, page_size }),
    }),
  );

  const isLoading = isFetching || isRefetching;
  const approvalRequests = data.data ?? SENTINEL_PAGED_RESPONSE;

  const formattedRows = useMemo<CountryTableRow[]>(
    () =>
      approvalRequests.data.map(request => ({
        ...request,
        id: request.country_iso3,
        pending_uploads: commaNumber(request.pending_uploads),
        rows_added: commaNumber(request.rows_added),
        rows_updated: commaNumber(request.rows_updated),
        rows_deleted: commaNumber(request.rows_deleted),
        country: (
          <span
            className={`${
              request.enabled
                ? "cursor-pointer text-blue-600 hover:underline"
                : ""
            }`}
            onClick={() =>
              request.enabled
                ? navigate({
                    to: "./uploads",
                    search: {
                      country: request.country_iso3,
                      dataset: request.dataset,
                    },
                  })
                : null
            }
          >
            {request.country} ({request.country_iso3})
          </span>
        ),
        dataset: request.dataset,
        actions: (
          <Button
            disabled={isLoading}
            kind="tertiary"
            size="sm"
            as={Link}
            to="./$countryCode"
            params={{ countryCode: request.country_iso3 }}
            onClick={() => resetApproveRowState()}
          >
            View Uploads
          </Button>
        ),
      })),
    [approvalRequests.data, isLoading, resetApproveRowState],
  );

  return (
    <DataTable
      title="Approval Requests"
      columns={columns}
      rows={formattedRows}
      isPaginated
      count={approvalRequests.total_count}
      handlePaginationChange={handlePaginationChange}
      page={approvalRequests.page}
      pageSize={approvalRequests.page_size}
      pageSizes={[10]}
    />
  );
}
