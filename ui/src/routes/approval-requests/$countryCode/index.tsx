import { ReactElement, useMemo } from "react";

import { CheckmarkFilled } from "@carbon/icons-react";
import { Button, DataTableHeader, DataTableSkeleton } from "@carbon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { useStore } from "@/context/store";
import { SENTINEL_PAGED_RESPONSE } from "@/types/api.ts";
import { UploadListing } from "@/types/approvalRequests";
import { commaNumber } from "@/utils/number.ts";
import { validateSearchParams } from "@/utils/pagination.ts";

const columns: DataTableHeader[] = [
  { key: "upload_id", header: "Upload ID" },
  { key: "dataset", header: "Dataset" },
  { key: "uploaded_at", header: "Uploaded" },
  { key: "uploader_email", header: "Uploaded By" },
  { key: "rows_added", header: "Rows to Add" },
  { key: "rows_updated", header: "Rows to Update" },
  { key: "rows_deleted", header: "Rows to Delete" },
  { key: "rows_unchanged", header: "Unchanged" },
  { key: "actions", header: "" },
];

export const Route = createFileRoute("/approval-requests/$countryCode/")({
  component: UploadsForCountry,
  validateSearch: validateSearchParams,
  loader: ({ params: { countryCode }, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      queryOptions({
        queryKey: ["approval-requests-uploads", countryCode, 1, 10],
        queryFn: () =>
          api.approvalRequests.listUploads(countryCode, {
            page: 1,
            page_size: 10,
          }),
      }),
    ),
  pendingComponent: () => <DataTableSkeleton headers={columns} />,
  errorComponent: () => (
    <DataTable title="Pending Uploads" columns={columns} rows={[]} />
  ),
});

type UploadTableRow = Record<
  keyof UploadListing,
  string | number | ReactElement
> & {
  id: string;
  actions: ReactElement;
};

function UploadsForCountry() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page = 1, page_size = 10 } = Route.useSearch();
  const { countryCode } = Route.useParams();
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
      queryKey: ["approval-requests-uploads", countryCode, page, page_size],
      queryFn: () =>
        api.approvalRequests.listUploads(countryCode, { page, page_size }),
    }),
  );

  const isLoading = isFetching || isRefetching;
  const uploadsData = data.data ?? SENTINEL_PAGED_RESPONSE;

  const formattedRows = useMemo<UploadTableRow[]>(
    () =>
      uploadsData.data.map(upload => ({
        ...upload,
        id: upload.upload_id,
        rows_added: commaNumber(upload.rows_added),
        rows_updated: commaNumber(upload.rows_updated),
        rows_deleted: commaNumber(upload.rows_deleted),
        rows_unchanged: commaNumber(upload.rows_unchanged),
        uploaded_at: format(
          new Date(upload.uploaded_at),
          DEFAULT_DATETIME_FORMAT,
        ),
        actions: (
          <Button
            disabled={isLoading || upload.is_merge_processing}
            kind="tertiary"
            size="sm"
            as={Link}
            to="./$uploadId"
            params={{ uploadId: upload.upload_id }}
            renderIcon={CheckmarkFilled}
            onClick={() => resetApproveRowState()}
          >
            {upload.is_merge_processing ? "Processing..." : "Review"}
          </Button>
        ),
      })),
    [uploadsData.data, isLoading, resetApproveRowState],
  );

  return (
    <DataTable
      title={`Pending Uploads — ${countryCode}`}
      columns={columns}
      rows={formattedRows}
      isPaginated
      count={uploadsData.total_count}
      handlePaginationChange={handlePaginationChange}
      page={uploadsData.page}
      pageSize={uploadsData.page_size}
      pageSizes={[10]}
    />
  );
}
