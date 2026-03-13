import { ReactElement, useMemo } from "react";

import {
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  DefinitionTooltip,
  OverflowMenu,
  OverflowMenuItem,
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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";

import { api, queryClient } from "@/api";
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
  source?: string | null;
  dataset?: string | null;
  isArchived?: boolean;
}

function RowMenu({
  upload,
  isArchived,
  onArchive,
  onUnarchive,
}: {
  upload: UploadResponse;
  isArchived: boolean;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}) {
  const navigate = useNavigate();
  const canView =
    upload.dataset !== "unstructured" &&
    upload.dq_status === DQStatus.COMPLETED;

  return (
    <OverflowMenu aria-label="Row actions" flipped>
      {canView && (
        <OverflowMenuItem
          itemText="View"
          onClick={() =>
            void navigate({
              to: "/upload/$uploadId",
              params: { uploadId: upload.id },
            })
          }
        />
      )}
      {!isArchived ? (
        <OverflowMenuItem
          itemText="Archive"
          onClick={() => onArchive(upload.id)}
        />
      ) : (
        <OverflowMenuItem
          itemText="Unarchive"
          onClick={() => onUnarchive(upload.id)}
        />
      )}
    </OverflowMenu>
  );
}

function UploadsTable({
  page,
  pageSize,
  handlePaginationChange,
  source,
  dataset,
  isArchived = false,
}: UploadsTableProps) {
  const { data: uploadsQuery, isLoading } = useSuspenseQuery({
    queryFn: () =>
      api.uploads.list_uploads({
        page,
        page_size: pageSize,
        source: source ?? undefined,
        dataset: dataset ?? undefined,
        is_archived: isArchived,
      }),
    queryKey: ["uploads", page, pageSize, source, dataset, isArchived],
  });

  const { mutate: archiveUpload } = useMutation({
    mutationFn: (uploadId: string) => api.uploads.archive_upload(uploadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["uploads"] });
    },
  });

  const { mutate: unarchiveUpload } = useMutation({
    mutationFn: (uploadId: string) => api.uploads.unarchive_upload(uploadId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["uploads"] });
    },
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
        actions: (
          <RowMenu
            upload={upload}
            isArchived={isArchived}
            onArchive={archiveUpload}
            onUnarchive={unarchiveUpload}
          />
        ),
      } as TableUpload;
    });

    return _renderUploads;
  }, [
    page,
    pageSize,
    uploadsQuery?.data,
    isArchived,
    archiveUpload,
    unarchiveUpload,
  ]);

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
