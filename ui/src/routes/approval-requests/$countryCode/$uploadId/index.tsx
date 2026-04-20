import { useMemo, useState } from "react";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  DataTableHeader,
  DataTableSkeleton,
  Modal,
  Section,
} from "@carbon/react";
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import CDFDataTable from "@/components/approval-requests/CDFDataTable";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { useStore } from "@/context/store";
import { SENTINEL_APPROVAL_REQUEST } from "@/types/approvalRequests";
import { validateSearchParams } from "@/utils/pagination.ts";

const skeletonHeaders: DataTableHeader[] = [
  { key: "school_id_giga", header: "school_id_giga" },
  { key: "_change_type", header: "_change_type" },
];

export const Route = createFileRoute(
  "/approval-requests/$countryCode/$uploadId/",
)({
  component: ApproveRejectTable,
  validateSearch: validateSearchParams,
  loader: ({ params: { countryCode, uploadId }, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      queryOptions({
        queryFn: () =>
          api.approvalRequests.get(countryCode, uploadId, {
            page: 1,
            page_size: 10,
          }),
        queryKey: ["approval-requests", countryCode, uploadId, 1, 10],
      }),
    ),
  pendingComponent: () => (
    <Section className="container py-6">
      <DataTableSkeleton headers={skeletonHeaders} />
    </Section>
  ),
  errorComponent: () => (
    <CDFDataTable
      headers={skeletonHeaders}
      rows={[]}
      handleApproveRows={() => {}}
      handleRejectRows={() => {}}
      handlePaginationChange={() => {}}
      handleApproveAll={() => {}}
      handleRejectAll={() => {}}
      info={{
        country: "",
        country_iso3: "",
        dataset: "",
        upload_id: "",
        uploaded_at: "",
        uploader_email: "",
      }}
      page={DEFAULT_PAGE_NUMBER}
      pageSize={DEFAULT_PAGE_SIZE}
      count={0}
    />
  ),
});

function ApproveRejectTable() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isApproveAllModalOpen, setIsApproveAllModalOpen] = useState(false);
  const [isRejectAllModalOpen, setIsRejectAllModalOpen] = useState(false);

  const {
    page = DEFAULT_PAGE_NUMBER,
    page_size: pageSize = DEFAULT_PAGE_SIZE,
  } = Route.useSearch();
  const { countryCode, uploadId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    selectedUploadIds,
    uploadActions: { clearSelectedUploadIds },
  } = useStore();

  const uploadIdsArray =
    selectedUploadIds.length > 0 ? selectedUploadIds : undefined;

  const {
    approveRowActions: {
      setApprovedRows,
      setHeaders,
      setRejectedRows,
      setRows,
      resetApproveRowState,
      setTotalCount,
    },
    approveRowState: { approvedRows, rejectedRows },
  } = useStore();

  const {
    data: approvalRequestsQuery,
    isFetching,
    isRefetching,
  } = useSuspenseQuery(
    queryOptions({
      queryFn: () =>
        api.approvalRequests.get(
          countryCode,
          uploadId,
          {
            page,
            page_size: pageSize,
          },
          uploadIdsArray ? uploadIdsArray : undefined,
        ),
      queryKey: [
        "approval-requests",
        countryCode,
        uploadId,
        page,
        pageSize,
        uploadIdsArray,
      ],
    }),
  );

  const isLoading = isFetching || isRefetching;

  const {
    data: approvalRequests,
    info,
    total_count,
  } = approvalRequestsQuery?.data ?? SENTINEL_APPROVAL_REQUEST;

  const headers = useMemo<DataTableHeader[]>(() => {
    const first = approvalRequests[0] ?? {
      school_id_giga: "",
      _change_type: "INSERT",
    };
    let keys = Object.keys(first);

    // Put school_id_giga first
    const gigaIdx = keys.findIndex(k => k === "school_id_giga");
    if (gigaIdx > -1) {
      keys = ["school_id_giga", ...keys.filter(k => k !== "school_id_giga")];
    }
    // Put approval_status second
    keys = ["approval_status", ...keys.filter(k => k !== "approval_status")];

    return keys.map(key => ({ key, header: key }));
  }, [approvalRequests]);

  const formattedRows = useMemo<Record<string, unknown>[]>(() => {
    const result: Record<string, unknown>[] = [];

    for (const row of approvalRequests) {
      const approvalStatus = approvedRows.includes(row.school_id_giga)
        ? "Approved"
        : rejectedRows.includes(row.school_id_giga)
        ? "Rejected"
        : "";

      // For UPDATE rows, prepend a non-selectable "current" row showing the old values
      if (row._change_type === "UPDATE") {
        const currentRecord: Record<string, unknown> = {
          _change_type: "CURRENT",
          id: `${row.school_id_giga}_current`,
          approval_status: approvalStatus,
        };
        for (const [key, value] of Object.entries(row)) {
          if (key === "_change_type") continue;
          currentRecord[key] =
            value !== null && typeof value === "object" && "old" in value
              ? (value as { old: unknown }).old
              : value;
        }
        result.push(currentRecord);
      }

      result.push({
        ...row,
        id: row.school_id_giga,
        approval_status: approvalStatus,
      });
    }

    return result;
  }, [approvalRequests, approvedRows, rejectedRows]);

  const { mutateAsync: submit, isPending } = useMutation({
    mutationKey: ["approval-request-submit", countryCode, uploadId],
    mutationFn: (data: {
      approved_rows?: string[];
      rejected_rows?: string[];
    }) => api.approvalRequests.submit({ countryCode, uploadId, ...data }),
  });

  const handleApproveRows = (rows: Record<string, unknown>[]) => {
    const newApproved = new Set(approvedRows.filter(r => r !== "__all__"));
    const newRejected = new Set(rejectedRows.filter(r => r !== "__all__"));

    for (const row of rows) {
      const id = row.school_id_giga as string;
      newApproved.add(id);
      newRejected.delete(id);
    }
    setApprovedRows([...newApproved]);
    setRejectedRows([...newRejected]);
    setHeaders(headers);
  };

  const handleRejectRows = (rows: Record<string, unknown>[]) => {
    const newRejected = new Set(rejectedRows.filter(r => r !== "__all__"));
    const newApproved = new Set(approvedRows.filter(r => r !== "__all__"));

    for (const row of rows) {
      const id = row.school_id_giga as string;
      newRejected.add(id);
      newApproved.delete(id);
    }
    setRejectedRows([...newRejected]);
    setApprovedRows([...newApproved]);
    setHeaders(headers);
  };

  const handleApproveAll = () => {
    setApprovedRows(["__all__"]);
    setRejectedRows([]);
    setHeaders(headers);
    setIsApproveAllModalOpen(true);
  };

  const handleRejectAll = () => {
    setRejectedRows(["__all__"]);
    setApprovedRows([]);
    setHeaders(headers);
    setIsRejectAllModalOpen(true);
  };

  const handlePaginationChange = ({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) => {
    void navigate({
      to: "",
      params: { countryCode, uploadId },
      search: { page, page_size: pageSize },
    });
  };

  const handleSubmit = () => {
    if (approvedRows.length + rejectedRows.length < total_count) {
      setIsConfirmModalOpen(true);
    } else {
      void handleProceed();
    }
  };

  const handleProceed = async () => {
    setRows(formattedRows as never);
    setTotalCount(total_count);
    await navigate({
      to: "/approval-requests/$countryCode/$uploadId/confirm",
      params: { countryCode, uploadId },
    });
  };

  const handleProceedAll = async () => {
    resetApproveRowState();
    clearSelectedUploadIds();
    await submit({ approved_rows: approvedRows });
    await navigate({ to: "/approval-requests" });
  };

  return (
    <>
      <CDFDataTable
        headers={headers}
        rows={formattedRows}
        handleApproveRows={handleApproveRows}
        handleRejectRows={handleRejectRows}
        handlePaginationChange={handlePaginationChange}
        handleApproveAll={handleApproveAll}
        handleRejectAll={handleRejectAll}
        page={page}
        pageSize={pageSize}
        count={total_count}
        info={info}
        isLoading={isLoading}
      />
      <div className="container">
        <ButtonSet className="w-full">
          <Button
            as={Link}
            className="w-full"
            isExpressive
            kind="secondary"
            renderIcon={ArrowLeft}
            to=".."
            onClick={() => resetApproveRowState()}
          >
            Cancel
          </Button>
          <Button
            className="w-full"
            isExpressive
            renderIcon={ArrowRight}
            type="submit"
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (approvedRows.length === 0 && rejectedRows.length === 0)
            }
          >
            Proceed
          </Button>
        </ButtonSet>
      </div>

      <Modal
        modalHeading="Confirm Selection"
        open={isConfirmModalOpen}
        primaryButtonText="Proceed"
        secondaryButtonText="Cancel"
        onRequestClose={() => setIsConfirmModalOpen(false)}
        onRequestSubmit={handleProceed}
      >
        You have {total_count - approvedRows.length - rejectedRows.length} rows
        not yet actioned. These will remain pending for later review. Proceed?
      </Modal>

      <Modal
        modalHeading="Approve All Rows"
        open={isApproveAllModalOpen}
        primaryButtonText="Approve All"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={isPending}
        loadingStatus={isPending ? "active" : "inactive"}
        onRequestClose={() => {
          setIsApproveAllModalOpen(false);
          setApprovedRows([]);
        }}
        onRequestSubmit={handleProceedAll}
      >
        All {total_count} rows will be approved and scheduled for merge into the
        school master dataset for {info.country}. Proceed?
      </Modal>

      <Modal
        modalHeading="Reject All Rows"
        open={isRejectAllModalOpen}
        primaryButtonText="Reject All"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={isPending}
        loadingStatus={isPending ? "active" : "inactive"}
        onRequestClose={() => {
          setIsRejectAllModalOpen(false);
          setRejectedRows([]);
        }}
        onRequestSubmit={handleProceedAll}
      >
        All {total_count} rows will be rejected. Proceed?
      </Modal>
    </>
  );
}
