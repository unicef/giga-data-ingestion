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
  {
    key: "approval_status",
    header: "approval_status",
  },
  {
    key: "school_id_giga",
    header: "school_id_giga",
  },
  {
    key: "_change_type",
    header: "_change_type",
  },
  {
    key: "_commit_timestamp",
    header: "_commit_timestamp",
  },
  {
    key: "_commit_version",
    header: "_commit_version",
  },
];

export const Route = createFileRoute("/approval-requests/$subpath/")({
  component: ApproveRejectTable,
  validateSearch: validateSearchParams,
  loader: ({ params: { subpath }, context: { queryClient } }) => {
    return queryClient.ensureQueryData(
      queryOptions({
        queryFn: () =>
          api.approvalRequests.get(subpath, { page: 1, page_size: 10 }),
        queryKey: ["approval-requests", subpath, 1, 10],
      }),
    );
  },
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
        dataset: "",
        timestamp: "",
        version: 0,
        country: "",
      }}
      page={DEFAULT_PAGE_NUMBER}
      pageSize={DEFAULT_PAGE_SIZE}
      count={0}
    />
  ),
});

function ApproveRejectTable() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isApproveAllModalOpen, setIsApproveAllModalOpen] = useState(false);
  const [isRejectAllModalOpen, setIsRejectAllModalOpen] = useState(false);

  const {
    page = DEFAULT_PAGE_NUMBER,
    page_size: pageSize = DEFAULT_PAGE_SIZE,
  } = Route.useSearch();
  const { subpath } = Route.useParams();
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
          subpath,
          {
            page,
            page_size: pageSize,
          },
          uploadIdsArray ? uploadIdsArray : undefined,
        ),
      queryKey: ["approval-requests", subpath, page, pageSize, uploadIdsArray],
    }),
  );

  const isLoading = isFetching || isRefetching;

  const {
    data: approvalRequests,
    info,
    total_count,
  } = approvalRequestsQuery?.data ?? SENTINEL_APPROVAL_REQUEST;

  const headers = useMemo<DataTableHeader[]>(() => {
    let keys = Object.keys(approvalRequests[0] ?? { _change_type: "insert" });
    const schoolIdGigaIndex = keys.findIndex(key => key === "school_id_giga");
    if (schoolIdGigaIndex > -1) {
      keys = [
        "school_id_giga",
        ...keys.slice(0, schoolIdGigaIndex),
        ...keys.slice(schoolIdGigaIndex + 1),
      ];
    }

    const changeIdIndex = keys.findIndex(key => key === "change_id");
    if (changeIdIndex > -1) {
      keys = [
        "approval_status",
        "change_id",
        ...keys.slice(0, changeIdIndex),
        ...keys.slice(changeIdIndex + 1),
      ];
    }

    return keys.map(key => ({
      key,
      header: key,
    }));
  }, [approvalRequests]);

  const formattedRows = useMemo<Record<string, string | null>[]>(() => {
    return approvalRequests.map(row => {
      const formattedRow: Record<string, string | null> = {
        ...row,
        id: row.change_id,
        approval_status: approvedRows.includes(row.change_id!)
          ? "Approved"
          : rejectedRows.includes(row.change_id!)
          ? "Rejected"
          : "",
      };
      return formattedRow;
    });
  }, [approvalRequests, approvedRows, rejectedRows]);

  const { mutateAsync: upload, isPending } = useMutation({
    mutationKey: ["approval-request-upload", subpath],
    mutationFn: api.approvalRequests.upload_approved_rows,
  });

  const handleApproveRows = (rows: Record<string, string | null>[]) => {
    const newApprovedRows = new Set(approvedRows);
    newApprovedRows.delete("__all__");

    for (const row of rows) {
      newApprovedRows.add(row.change_id!);
    }
    setApprovedRows([...newApprovedRows]);

    const ids = rows.map(row => row.change_id ?? "").filter(Boolean);

    // Remove ids from rejected rows
    const newRejectedRows = new Set(rejectedRows);
    newRejectedRows.delete("__all__");

    for (const id of ids) {
      if (newApprovedRows.has(id)) {
        newRejectedRows.delete(id);
      }
    }
    setRejectedRows([...newRejectedRows]);

    setHeaders(headers);
  };

  const handleRejectRows = (rows: Record<string, string | null>[]) => {
    const newRejectedRows = new Set(rejectedRows);
    newRejectedRows.delete("__all__");

    for (const row of rows) {
      newRejectedRows.add(row.change_id!);
    }
    setRejectedRows([...newRejectedRows]);

    const ids = rows.map(row => row.change_id ?? "").filter(Boolean);
    // Remove ids from approved rows
    const newApprovedRows = new Set(approvedRows);
    newApprovedRows.delete("__all__");

    for (const id of ids) {
      if (newRejectedRows.has(id)) {
        newApprovedRows.delete(id);
      }
    }
    setApprovedRows([...newApprovedRows]);

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
      params: { subpath },
      search: {
        page,
        page_size: pageSize,
      },
    });
  };

  const handleSubmit = () => {
    if (Object.keys(approvedRows).length < total_count) {
      setIsConfirmModalOpen(true);
    } else {
      void handleProceed();
    }
  };

  const handleProceed = async () => {
    setRows(formattedRows);
    setTotalCount(total_count);

    await navigate({
      to: "/approval-requests/$subpath/confirm",
      params: { subpath },
    });
  };

  const handleProceedAll = async () => {
    resetApproveRowState();
    clearSelectedUploadIds();
    await upload({ approved_rows: approvedRows, subpath });
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
            disabled={isLoading}
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
        You have {total_count - approvedRows.length} unapproved rows. These rows
        will be automatically rejected. Proceed?
      </Modal>

      <Modal
        modalHeading="Confirm Approve All"
        open={isApproveAllModalOpen}
        primaryButtonText="Proceed"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={isPending}
        loadingStatus={isPending ? "active" : "inactive"}
        onRequestClose={() => {
          setIsApproveAllModalOpen(false);
          setApprovedRows([]);
          setRejectedRows([]);
        }}
        onRequestSubmit={handleProceedAll}
      >
        You are approving all {total_count} rows, which will be merged shortly
        into the school master dataset for {info.country}. Note that rows
        corresponding to the same <code>school_id_giga</code> will automatically
        be deduplicated based on the latest <code>_commit_version</code>.
        Proceed?
      </Modal>

      <Modal
        modalHeading="Confirm Reject All"
        open={isRejectAllModalOpen}
        primaryButtonText="Proceed"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={isPending}
        loadingStatus={isPending ? "active" : "inactive"}
        onRequestClose={() => {
          setIsRejectAllModalOpen(false);
          setApprovedRows([]);
          setRejectedRows([]);
        }}
        onRequestSubmit={handleProceedAll}
      >
        You are rejecting all {total_count} rows. Proceed?
      </Modal>
    </>
  );
}
