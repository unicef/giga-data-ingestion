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
import {
  ChangeType,
  SENTINEL_APPROVAL_REQUEST,
} from "@/types/approvalRequests";
import {
  cdfComponentStringHash,
  cdfRowStringHash,
} from "@/utils/approval_requests.ts";
import { validateSearchParams } from "@/utils/pagination.ts";

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
      ];
    }
    return keys.map(key => ({
      key,
      header: key,
    }));
  }, [approvalRequests]);

  const formattedRows = useMemo<Record<string, string | null>[]>(
    () =>
      approvalRequests.map(row => {
        const id = cdfRowStringHash(row);

        return {
          ...row,
          id,
          approval_status: Object.keys(approvedRows).includes(id)
            ? "Approved"
            : Object.keys(rejectedRows).includes(id)
            ? "Rejected"
            : "",
        };
      }),
    [approvalRequests, approvedRows, rejectedRows],
  );

  const handleApproveRows = (rows: Record<string, string | null>[]) => {
    const ids: string[] = [];

    const newApprovedRows = { ...approvedRows };
    for (const row of rows) {
      const id = cdfRowStringHash(row);
      ids.push(id);

      // Only one of update_preimage/update_postimage for the same
      // _commit_version/school_id_giga combination can be approved
      if (row._change_type === "update_preimage") {
        const id = cdfComponentStringHash({
          school_id_giga: row.school_id_giga!,
          _change_type: "update_postimage",
          _commit_version: Number(row._commit_version),
        });
        if (id in newApprovedRows) {
          delete newApprovedRows[id];
        }
      }

      if (row._change_type === "update_postimage") {
        const id = cdfComponentStringHash({
          school_id_giga: row.school_id_giga!,
          _change_type: "update_preimage",
          _commit_version: Number(row._commit_version),
        });
        if (id in newApprovedRows) {
          delete newApprovedRows[id];
        }
      }

      newApprovedRows[id] = {
        school_id_giga: row.school_id_giga!,
        _change_type: row._change_type as ChangeType,
        _commit_version: Number(row._commit_version),
      };
    }
    setApprovedRows(newApprovedRows);

    // Remove ids from rejected rows
    const newRejectedRows = { ...rejectedRows };
    for (const id of ids) {
      if (id in newRejectedRows) {
        delete newRejectedRows[id];
      }
    }
    setRejectedRows(newRejectedRows);

    setHeaders(headers);
  };

  const handleRejectRows = (rows: Record<string, string | null>[]) => {
    const ids: string[] = [];

    const _rejectedRows = { ...rejectedRows };
    for (const row of rows) {
      const id = cdfRowStringHash(row);
      ids.push(id);
      _rejectedRows[id] = {
        school_id_giga: row.school_id_giga!,
        _change_type: row._change_type as ChangeType,
        _commit_version: Number(row._commit_version),
      };
    }
    setRejectedRows(_rejectedRows);

    // Remove ids from approved rows
    const _approvedRows = { ...approvedRows };
    for (const id of ids) {
      if (id in _approvedRows) {
        delete _approvedRows[id];
      }
    }
    setApprovedRows(_approvedRows);

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
        You have {total_count - Object.keys(approvedRows).length} unapproved
        rows. These rows will be automatically rejected. Proceed?
      </Modal>
    </>
  );
}
