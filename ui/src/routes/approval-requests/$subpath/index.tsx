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
import { HEADERS } from "@/constants/ingest-api";
import { useStore } from "@/context/store";
import { SENTINEL_APPROVAL_REQUEST } from "@/types/approvalRequests";

export const Route = createFileRoute("/approval-requests/$subpath/")({
  component: ApproveRejectTable,
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
});

function ApproveRejectTable() {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isOpen, setOpen] = useState<boolean>(false);

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
  const { data: approvalRequestsQuery } = useSuspenseQuery(
    queryOptions({
      queryFn: () =>
        api.approvalRequests.get(subpath, { page: page, page_size: pageSize }),
      queryKey: ["approval-requests", subpath, page, pageSize],
    }),
  );
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
        id: row.school_id_giga,
      })),
    [approvalRequests],
  );

  const unselectedRows = useMemo<Record<string, string | null>[]>(() => {
    return formattedRows.filter(
      approvalRequest =>
        !approvedRowsList.includes(approvalRequest.school_id_giga ?? "") &&
        !rejectedRowsList.includes(approvalRequest.school_id_giga ?? ""),
    );
  }, [formattedRows, approvedRowsList, rejectedRowsList]);

  const handleApproveRows = (rows: Record<string, string | null>[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "NULL");
    setApprovedRows([...approvedRowsList, ...ids]);
    setHeaders(headers);
  };

  const handleRejectRows = (rows: Record<string, string | null>[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "NULL");
    setRejectedRows([...rejectedRowsList, ...ids]);
    setHeaders(headers);
  };

  const handlePaginationChange = ({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) => {
    setPage(page);
    setPageSize(pageSize);
  };

  const handleSubmit = () => {
    if (unselectedRows.length > 0) {
      setOpen(true);
    } else {
      handleProceed();
    }
  };
  const handleProceed = () => {
    const unselectedRowsIds = unselectedRows.map(
      row => row.school_id_giga ?? "NULL",
    );

    setRejectedRows([...rejectedRowsList, ...unselectedRowsIds]);
    setRows(formattedRows);

    void navigate({
      to: "/approval-requests/$subpath/confirm",
      params: {
        subpath: subpath,
      },
    });
  };

  return (
    <>
      <CDFDataTable
        headers={headers}
        rows={unselectedRows}
        handleApproveRows={handleApproveRows}
        handleRejectRows={handleRejectRows}
        handlePaginationChange={handlePaginationChange}
        page={page}
        pageSize={pageSize}
        count={total_count}
        info={info}
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
        You have {unselectedRows.length} unselected rows. These rows will be
        automatically rejected. Are you sure?
      </Modal>
    </>
  );
}
