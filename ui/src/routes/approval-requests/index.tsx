import { ReactElement, useMemo } from "react";

import { CheckmarkFilled, Edit, TrashCan } from "@carbon/icons-react";
import {
  Button,
  DataTableHeader,
  DataTableSkeleton,
  Loading,
  Tag,
  Tooltip,
} from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import { listApprovalRequestQueryOptions } from "@/api/queryOptions";
import DataTable from "@/components/common/DataTable.tsx";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { useStore } from "@/context/store";
import { SENTINEL_PAGED_RESPONSE } from "@/types/api.ts";
import { ApprovalRequestListing } from "@/types/approvalRequests";
import { commaNumber } from "@/utils/number.ts";
import { validateSearchParams } from "@/utils/pagination.ts";

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
    key: "operation_type",
    header: "Operation Type",
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
    header: (
      <Tooltip label="Number of unique new records to be added">
        <span>Rows Added</span>
      </Tooltip>
    ),
  },
  {
    key: "rows_updated",
    header: (
      <Tooltip label="Number of unique records to be updated">
        <span>Rows Updated</span>
      </Tooltip>
    ),
  },
  {
    key: "rows_deleted",
    header: (
      <Tooltip label="Number of unique records to be deleted">
        <span>Rows Deleted</span>
      </Tooltip>
    ),
  },
  {
    key: "actions",
    header: "",
  },
];

export const Route = createFileRoute("/approval-requests/")({
  component: ApprovalRequests,
  validateSearch: validateSearchParams,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(listApprovalRequestQueryOptions),
  pendingComponent: () => <DataTableSkeleton headers={columns} />,
  errorComponent: () => (
    <DataTable title="Approval Requests" columns={columns} rows={[]} />
  ),
});

type ApprovalRequestTableRow = Record<
  keyof ApprovalRequestListing,
  string | number | null | boolean | ReactElement
> & { id: string; actions: ReactElement; operation_type: ReactElement };

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
    void navigate({
      to: "",
      search: {
        page,
        page_size: pageSize,
      },
    });
  }

  const { data, isFetching, isRefetching } = useSuspenseQuery(
    queryOptions({
      queryKey: ["approval-requests", page, page_size],
      queryFn: () => api.approvalRequests.list({ page, page_size }),
    }),
  );

  const isLoading = isFetching || isRefetching;

  const approvalRequests = data.data ?? SENTINEL_PAGED_RESPONSE;

  const formattedApprovalRequests = useMemo<ApprovalRequestTableRow[]>(
    () =>
      approvalRequests.data.map(request => {
        let operationIcon = Edit;
        let operationType = "Update";
        let tagType: "blue" | "red" | "green" | "purple" = "blue";

        if (request.is_delete_operation) {
          operationIcon = TrashCan;
          operationType = "Delete";
          tagType = "red";
        } else if (request.rows_added > 0 && request.rows_updated === 0) {
          operationType = "Insert";
          tagType = "green";
        } else if (request.rows_added > 0 && request.rows_updated > 0) {
          operationType = "Mixed";
          tagType = "purple";
        }

        return {
          ...request,
          rows_count: commaNumber(request.rows_count),
          rows_added: commaNumber(request.rows_added),
          rows_updated: commaNumber(request.rows_updated),
          rows_deleted: commaNumber(request.rows_deleted),
          country: `${request.country} (${request.country_iso3})`,
          operation_type: (
            <Tag type={tagType} renderIcon={operationIcon}>
              {operationType}
            </Tag>
          ),
          actions: (
            <Button
              disabled={isLoading || !request.enabled}
              kind="tertiary"
              size="sm"
              as={Link}
              to="./$subpath"
              renderIcon={
                isLoading
                  ? props => (
                      <Loading small={true} withOverlay={false} {...props} />
                    )
                  : CheckmarkFilled
              }
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
        };
      }),
    [approvalRequests.data, isLoading, resetApproveRowState],
  );

  return (
    <DataTable
      title="Approval Requests"
      columns={columns}
      rows={formattedApprovalRequests}
      isPaginated
      count={approvalRequests.total_count}
      handlePaginationChange={handlePaginationChange}
      page={approvalRequests.page}
      pageSize={approvalRequests.page_size}
      pageSizes={[10]}
    />
  );
}
