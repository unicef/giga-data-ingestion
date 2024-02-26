import { ReactElement, useMemo, useState } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
// @ts-expect-error missing types https://github.com/carbon-design-system/carbon/issues/14831
import Pagination from "@carbon/react/lib/components/Pagination/Pagination";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { api } from "@/api";
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
    header: "Actions",
  },
];

interface TableUpload extends UploadResponse {
  status: ReactElement | string | null;
  actions: ReactElement | null;
}

function UploadsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: uploadsQuery, isLoading } = useQuery({
    queryFn: () => api.uploads.list({ page, page_size: pageSize }),
    queryKey: ["uploads", page, pageSize],
  });

  const renderUploads = useMemo<PagedResponse<TableUpload>>(() => {
    const uploads = uploadsQuery?.data ?? {
      data: [],
      page,
      page_size: pageSize,
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
  }, [page, pageSize, uploadsQuery?.data]);

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
            pageSize={pageSize}
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
