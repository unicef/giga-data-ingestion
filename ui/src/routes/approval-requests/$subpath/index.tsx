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

  const formattedData = useMemo(() => {
    const dataSlice = data.slice((page - 1) * pageSize, page * pageSize);

    const x = dataSlice.map((row, index) => {
      const rowWithId = { ...row, id: `${index}-${row.school_id_giga}` };

      const entries = Object.entries(rowWithId).map(([key, value]) => {
        if (key == "id") return [key, value];

        return [
          key,
          <div
            className={cn({
              // "bg-giga-yellow": true,
            })}
          >
            outerContent
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >{`${value}`}</Markdown>
            outerDiv
          </div>,
        ];
      });

      return Object.fromEntries(entries);
    });

    return x;
  }, [data, page, pageSize]);

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
