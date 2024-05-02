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
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { useStore } from "@/context/store";
import { SENTINEL_APPROVAL_REQUEST } from "@/types/approvalRequests";
import { computeChangeId } from "@/utils/approval_requests.ts";
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
    approveRowState: { approvedRows, rejectedRows },
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
        "change_id",
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

  const handleApproveRows = (rows: Record<string, string | null>[]) => {
    console.log(rows);

    const newApprovedRows = new Set(approvedRows);

    for (const row of rows) {
      // Only one of update_preimage/update_postimage for the same
      // school_id_giga/_commit_version/_commit_timestamp combination
      // can be approved
      if (row._change_type === "update_preimage") {
        const postImageId = computeChangeId({
          school_id_giga: row.school_id_giga!,
          _change_type: "update_postimage",
          _commit_version: Number(row._commit_version),
          _commit_timestamp: row._commit_timestamp!,
        });
        newApprovedRows.delete(postImageId);
      } else if (row._change_type === "update_postimage") {
        const preImageId = computeChangeId({
          school_id_giga: row.school_id_giga!,
          _change_type: "update_preimage",
          _commit_version: Number(row._commit_version),
          _commit_timestamp: row._commit_timestamp!,
        });
        newApprovedRows.delete(preImageId);
      }

      newApprovedRows.add(row.change_id!);
    }
    setApprovedRows([...newApprovedRows]);

    const ids = rows.map(row => row.change_id ?? "").filter(Boolean);

    // Remove ids from rejected rows
    const newRejectedRows = new Set(rejectedRows);
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
    for (const row of rows) {
      newRejectedRows.add(row.change_id!);
    }
    setRejectedRows([...newRejectedRows]);

    const ids = rows.map(row => row.change_id ?? "").filter(Boolean);
    // Remove ids from approved rows
    const newApprovedRows = new Set(approvedRows);
    for (const id of ids) {
      if (newRejectedRows.has(id)) {
        newApprovedRows.delete(id);
      }
    }
    setApprovedRows([...newApprovedRows]);

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
    if (Object.keys(approvedRows).length < total_count) {
      setOpen(true);
    } else {
      void handleProceed();
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
            disabled={isLoading}
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
        You have {total_count - approvedRows.length} unapproved rows. These rows
        will be automatically rejected. Proceed?
      </Modal>
    </>
  );
}
