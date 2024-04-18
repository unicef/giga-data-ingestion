import { useMemo, useState } from "react";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import { Button, ButtonSet, DataTableHeader } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import CDFDataTable from "@/components/approval-requests/CDFDataTable";
import { useStore } from "@/context/store";
import { SENTINEL_APPROVAL_REQUEST } from "@/types/approvalRequests";

export const Route = createFileRoute("/approval-requests/$subpath/")({
  component: ApproveRejectTable,
  loader: ({ params: { subpath }, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryFn: () => api.approvalRequests.get(subpath),
      queryKey: ["approval-requests", subpath],
    });
  },
});

function ApproveRejectTable() {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const { subpath } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    approveRowActions: {
      setApprovedRows,
      setHeaders,
      setRejectedRows,
      setRows,
    },
    approveRowState: { approvedRowsList, rejectedRowsList },
  } = useStore();
  const { data: approvalRequestsQuery } = useSuspenseQuery({
    queryFn: () => api.approvalRequests.get(subpath),
    queryKey: ["approval-requests", subpath],
  });
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

  const handleApproveRows = (rows: Record<string, string | null>[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "NULL");
    setApprovedRows([...approvedRowsList, ...ids]);
    setHeaders(headers);
    setRows(formattedRows);
  };

  const handleRejectRows = (rows: Record<string, string | null>[]) => {
    const ids = rows.map(row => row.school_id_giga ?? "NULL");
    setRejectedRows([...rejectedRowsList, ...ids]);
    setHeaders(headers);
    setRows(formattedRows);
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

  const handleProceed = () => {
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
        rows={formattedRows}
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
          >
            Cancel
          </Button>
          <Button
            className="w-full"
            isExpressive
            renderIcon={ArrowRight}
            type="submit"
            onClick={handleProceed}
          >
            Proceed
          </Button>
        </ButtonSet>
      </div>
    </>
  );
}
