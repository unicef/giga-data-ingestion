import { Download } from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
} from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { errorTableQueryOptions } from "@/api/queryOptions";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

const HEADERS = [
  { key: "country_code", header: "Country" },
  { key: "dataset_type", header: "Dataset Type" },
  { key: "school_id_govt", header: "School ID (Govt)" },
  { key: "school_name", header: "School Name" },
  { key: "failure_reason", header: "Failure Reason" },
  { key: "created_at", header: "Created At" },
];

const Route = getRouteApi("/error-table");

export default function ErrorTable() {
  const {
    page = DEFAULT_PAGE_NUMBER,
    page_size = DEFAULT_PAGE_SIZE,
    country_code,
    dataset_type,
    file_id,
  } = Route.useSearch();
  const navigate = useNavigate({ from: "/error-table" });

  const { data: errorsResponse, isLoading } = useSuspenseQuery(
    errorTableQueryOptions({
      page,
      page_size,
      country_code,
      dataset_type,
      file_id,
    }),
  );

  const errorsData = errorsResponse.data.data;
  const totalCount = errorsResponse.data.total_count;

  const rows = errorsData.map((item, index) => ({
    id: `${item.giga_sync_file_id}-${index}`,
    ...item,
    created_at: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "N/A",
  }));

  const handlePaginationChange = ({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) => {
    void navigate({
      to: ".",
      search: prev => ({
        ...prev,
        page,
        page_size: pageSize,
      }),
    });
  };

  const handleDownload = async () => {
    try {
      const response = await api.errorTable.download_upload_errors({
        country_code,
        dataset_type,
        file_id,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `upload_errors_${country_code || "all"}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download errors:", error);
    }
  };

  if (isLoading) return <DataTableSkeleton headers={HEADERS} />;

  return (
    <>
      <h3 className="mb-4 text-lg font-semibold">Detailed Errors</h3>
      <DataTable headers={HEADERS} rows={rows}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <Button
                  kind="primary"
                  renderIcon={Download}
                  onClick={handleDownload}
                  size="sm"
                >
                  Download CSV
                </Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type
                    <TableHeader {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow {...getRowProps({ row })}>
                    {row.cells.map(cell => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              pageSize={page_size}
              pageSizes={[10, 25, 50]}
              totalItems={totalCount}
              onChange={handlePaginationChange}
            />
          </TableContainer>
        )}
      </DataTable>
    </>
  );
}
