import { ReactElement, useMemo } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  DefinitionTooltip,
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
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime.ts";
import { PagedResponse } from "@/types/api.ts";
import {
  DQStatus,
  DQStatusTagMapping,
  UploadResponse,
} from "@/types/upload.ts";

const columns: DataTableHeader[] = [
  {
    key: "id",
    header: "Upload ID",
  },
  {
    key: "created",
    header: (
      <DefinitionTooltip
        align="right"
        definition="Date uploaded is the server time"
        openOnHover
      >
        <b>Date uploaded</b>
      </DefinitionTooltip>
    ),
  },
  {
    key: "uploader_email",
    header: "Uploaded by",
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
    header: "DQ check status",
  },
  {
    key: "actions",
    header: "",
  },
];

type TableUpload = Record<
  keyof UploadResponse,
  ReactElement | string | number | null | DQStatus | boolean
> & { id: string };

interface UploadsTableProps {
  page: number;
  pageSize: number;
  handlePaginationChange: ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => void;
}

function UploadsTable({
  page,
  pageSize,
  handlePaginationChange,
}: UploadsTableProps) {
  const { data: uploadsQuery, isLoading } = useSuspenseQuery({
    queryFn: () => api.uploads.list_uploads({ page, page_size: pageSize }),
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
      const isUnstructured = upload.dataset === "unstructured";
      const statusText = upload.dq_status.replace("_", " ").toLowerCase();

      return {
        ...upload,
        created: format(new Date(upload.created), DEFAULT_DATETIME_FORMAT),
        dataset: (
          <>
            <span className="capitalize">{upload.dataset}</span>
            {upload.source && (
              <span className="uppercase"> ({upload.source})</span>
            )}
          </>
        ),
        status: (
          <Tag
            type={DQStatusTagMapping[upload.dq_status]}
            className="capitalize"
          >
            {statusText}
          </Tag>
        ),
        actions: !isUnstructured && (
          <Button
            as={Link}
            to="/upload/$uploadId"
            params={{ uploadId: upload.id }}
            kind="ghost"
            size="sm"
            disabled={upload.dq_status !== DQStatus.COMPLETED}
          >
            View
          </Button>
        ),
      } as TableUpload;
    });

    return _renderUploads;
  }, [page, pageSize, uploadsQuery?.data]);

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
