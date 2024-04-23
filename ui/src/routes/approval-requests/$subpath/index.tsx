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
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import CDFDataTable from "@/components/approval-requests/CDFDataTable";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { HEADERS } from "@/constants/ingest-api";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { useStore } from "@/context/store";
import { SENTINEL_APPROVAL_REQUEST } from "@/types/approvalRequests";
import { validateSearchParams } from "@/utils/pagination.ts";
import { difference } from "@/utils/set.ts";

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
      <DataTableSkeleton headers={HEADERS} />
    </Section>
  ),
  errorComponent: ErrorComponent,
});

function ApproveRejectTable() {
  const [isOpen, setOpen] = useState<boolean>(false);

  const {
    page = DEFAULT_PAGE_NUMBER,
    page_size: pageSize = DEFAULT_PAGE_SIZE,
  } = Route.useSearch();
  const { subpath } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    approveRowActions: {
      setApprovedRows,
      setHeaders,
      setRejectedRows,
      setRows,
      resetApproveRowState,
    },
    approveRowState: { approvedRowsList, rejectedRowsList },
  } = useStore();

  const {
    data: approvalRequestsQuery,
    isFetching,
    isRefetching,
  } = useSuspenseQuery(
    queryOptions({
      queryFn: () =>
        api.approvalRequests.get(subpath, { page: page, page_size: pageSize }),
      queryKey: ["approval-requests", subpath, page, pageSize],
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
    const idIndex = keys.findIndex(key => key === "school_id_giga");
    if (idIndex > -1) {
      keys = [
        "approval_status",
        "school_id_giga",
        ...keys.slice(0, idIndex),
        ...keys.slice(idIndex + 1),
      ];
    }
    return keys.map(key => ({
      key,
      header: key,
    }));
  }, [approvalRequests]);

  const formattedRows = useMemo<Record<string, string | null>[]>(
    () =>
      approvalRequests.map(row => ({
        ...row,
        id: `${row.school_id_giga}-${row._commit_version}`,
        approval_status: approvedRowsList.includes(row.school_id_giga ?? "")
          ? "Approved"
          : rejectedRowsList.includes(row.school_id_giga ?? "")
          ? "Rejected"
          : "",
      })),
    [approvalRequests, approvedRowsList, rejectedRowsList],
  );

  const handleApproveRows = (rows: Record<string, string | null>[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "").filter(Boolean);

    const _approvedRows = new Set([...approvedRowsList, ...ids]);
    setApprovedRows([..._approvedRows]);

    const _rejectedRows = difference(new Set(rejectedRowsList), new Set(ids));
    setRejectedRows([..._rejectedRows]);

    setHeaders(headers);
  };

  const handleRejectRows = (rows: Record<string, string | null>[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "").filter(Boolean);

    const _rejectedRows = new Set([...rejectedRowsList, ...ids]);
    setRejectedRows([..._rejectedRows]);

    const _approvedRows = difference(new Set(approvedRowsList), new Set(ids));
    setApprovedRows([..._approvedRows]);

    setHeaders(headers);
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
    if (approvedRowsList.length < total_count) {
      setOpen(true);
    } else {
      handleProceed();
    }
  };

  const handleProceed = async () => {
    setRows(formattedRows);

    await navigate({
      to: "/approval-requests/$subpath/confirm",
      params: { subpath },
    });
  };

  return (
    <>
      <CDFDataTable
        headers={headers}
        rows={formattedRows}
        handleApproveRows={handleApproveRows}
        handleRejectRows={handleRejectRows}
        handlePaginationChange={handlePaginationChange}
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
          >
            Proceed
          </Button>
        </ButtonSet>
      </div>
      <Modal
        modalHeading="Confirm Selection"
        open={isOpen}
        primaryButtonText="Proceed"
        secondaryButtonText="Cancel"
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={handleProceed}
      >
        You have {total_count - approvedRowsList.length} unselected rows. These
        rows will be automatically rejected. Proceed?
      </Modal>
    </>
  );
}
