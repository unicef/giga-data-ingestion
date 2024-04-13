import { ReactElement, useMemo } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { PagedResponse } from "@/types/api.ts";
import { UploadResponse } from "@/types/upload.ts";

const columns: DataTableHeader[] = [
  {
    key: "id",
    header: "Upload Id",
  },
  {
    key: "created",
    header: "Date Uploaded",
  },
  {
    key: "dataset",
    header: "Dataset",
  },
  {
    key: "country",
    header: "Country",
  },
  {
    key: "status",
    header: "Status",
  },
  {
    key: "actions",
    header: "",
  },
];

type TableUpload = Record<
  keyof UploadResponse,
  ReactElement | string | number | null
> & { id: string };

function UploadsTable() {
  const { page, page_size } = useSearch({ from: "/upload/" });
  const navigate = useNavigate({ from: "/upload/" });

  const { data: uploadsQuery, isLoading } = useSuspenseQuery({
    queryFn: () => api.uploads.list_uploads({ page, page_size }),
    queryKey: ["uploads", page, page_size],
  });

  const renderUploads = useMemo<PagedResponse<TableUpload>>(() => {
    const uploads = uploadsQuery?.data ?? {
      data: [],
      page,
      page_size,
      total_count: 0,
    };

    const _renderUploads = {
      data: [],
      page: uploads.page,
      page_size: uploads.page_size,
      total_count: uploads.total_count,
    } as PagedResponse<TableUpload>;

    _renderUploads.data = uploads.data.map(upload => {
      const isStatusCompleted = upload.dq_report_path !== null;

      return {
        ...upload,
        created: format(new Date(upload.created), DEFAULT_DATETIME_FORMAT),
        dataset: <span className="capitalize">{upload.dataset}</span>,
        status: isStatusCompleted ? (
          <Tag type="blue">Completed</Tag>
        ) : (
          <Tag type="gray">In Progress</Tag>
        ),
        actions: (
          <Button
            as={Link}
            to="/upload/$uploadId"
            params={{ uploadId: upload.id }}
            kind="ghost"
            size="sm"
            disabled={!isStatusCompleted}
          >
            View
          </Button>
        ),
      } as TableUpload;
    });

    return _renderUploads;
  }, [page, page_size, uploadsQuery?.data]);

  function handlePaginationChange({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) {
    void navigate({ to: "./", search: () => ({ page, page_size: pageSize }) });
  }

  return isLoading ? (
    <DataTableSkeleton headers={columns} />
  ) : (
    <DataTable headers={columns} rows={renderUploads.data}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map(header => (
                  // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                  <TableHeader colSpan={1} {...getHeaderProps({ header })}>
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
            totalItems={renderUploads.total_count}
            onChange={handlePaginationChange}
          />
        </TableContainer>
      )}
    </DataTable>
  );
}

export default UploadsTable;
