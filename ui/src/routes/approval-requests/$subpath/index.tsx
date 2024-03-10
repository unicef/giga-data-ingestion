import { useMemo, useState } from "react";
import Markdown from "react-markdown";

import { DataTableHeader, Section } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import remarkGfm from "remark-gfm";

import { api, queryClient } from "@/api";
import DataTable from "@/components/common/DataTable.tsx";
import { cn } from "@/lib/utils.ts";

export const Route = createFileRoute("/approval-requests/$subpath/")({
  component: ApproveRejectTable,
  loader: ({ params: { subpath } }) => {
    return queryClient.ensureQueryData({
      queryFn: () => api.approvalRequests.get(subpath),
      queryKey: ["approval-requests", subpath],
    });
  },
});

function ApproveRejectTable() {
  const { subpath } = Route.useParams();
  const {
    data: { data },
  } = useSuspenseQuery({
    queryFn: () => api.approvalRequests.get(subpath),
    queryKey: ["approval-requests", subpath],
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: DataTableHeader[] = useMemo(
    () =>
      Object.keys(data[0])
        .map(key => ({
          key,
          header: key,
        }))
        .filter(header => header.key !== "_change_type"),
    [data],
  );

  const formattedData = useMemo(
    () =>
      data.slice((page - 1) * pageSize, page * pageSize).map(row =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            <div
              className={cn({
                "bg-giga-yellow": row._change_data === "update_preimage",
                "bg-giga-green": row._change_data === "insert",
                "bg-giga-red": row._change_data === "remove",
              })}
            >
              <Markdown remarkPlugins={[remarkGfm]}>{`${value}`}</Markdown>
            </div>,
          ]),
        ),
      ),
    [data, page, pageSize],
  );

  function handlePaginationChange({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) {
    setPage(page);
    setPageSize(pageSize);
  }

  return (
    <Section className="container py-6">
      <DataTable
        columns={columns}
        rows={formattedData}
        size="sm"
        isPaginated
        page={page}
        pageSize={pageSize}
        count={data.length}
        handlePaginationChange={handlePaginationChange}
      />
    </Section>
  );
}
