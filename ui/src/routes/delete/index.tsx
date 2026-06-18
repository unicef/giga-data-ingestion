import { ReactNode, useState } from "react";

import { Add } from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  DefinitionTooltip,
  Heading,
  Pagination,
  Section,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { api } from "@/api";
import { ErrorComponent } from "@/components/common/ErrorComponent";
import { PendingComponent } from "@/components/common/PendingComponent";
import { DEFAULT_DATETIME_FORMAT } from "@/constants/datetime";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { DeleteIdType, DeletionRequest } from "@/types/delete";

export const Route = createFileRoute("/delete/")({
  component: DeletionLanding,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
});

const columns: DataTableHeader[] = [
  { key: "id", header: "Request ID" },
  {
    key: "requested_date",
    header: (
      <DefinitionTooltip
        align="right"
        definition="Date is the server time"
        openOnHover
      >
        <b>Date requested</b>
      </DefinitionTooltip>
    ),
  },
  { key: "country", header: "Country" },
  { key: "requested_by_email", header: "Requested by" },
  { key: "original_filename", header: "File" },
  { key: "id_type", header: "ID type" },
  { key: "school_count", header: "Schools affected" },
  { key: "status", header: "Status" },
];

const ID_TYPE_LABELS: Record<DeleteIdType, string> = {
  school_id_giga: "school_id_giga",
  school_id_govt: "school_id_govt",
};

function StatusTag({ status }: { status: string | null }) {
  if (!status) return <>—</>;
  const map: Record<string, { type: string; label: string }> = {
    PROCESSING: { type: "blue", label: "Processing" },
    PENDING_APPROVAL: { type: "warm-gray", label: "Pending Approval" },
    NO_MATCHES: { type: "red", label: "No Matches" },
    APPROVED: { type: "green", label: "Approved" },
    REJECTED: { type: "red", label: "Rejected" },
  };
  const entry = map[status];
  return entry ? (
    <Tag type={entry.type as never}>{entry.label}</Tag>
  ) : (
    <Tag type="gray">{status}</Tag>
  );
}

type TableRowData = Record<string, ReactNode> & { id: string };

function toTableRow(req: DeletionRequest): TableRowData {
  return {
    id: req.id,
    requested_date: format(
      new Date(req.requested_date),
      DEFAULT_DATETIME_FORMAT,
    ),
    country: req.country,
    requested_by_email: req.requested_by_email,
    original_filename: req.original_filename ?? "—",
    id_type: req.is_delete_all ? (
      <Tag type="red">All schools</Tag>
    ) : req.id_type ? (
      <Tag type="blue">{ID_TYPE_LABELS[req.id_type]}</Tag>
    ) : (
      "—"
    ),
    school_count:
      req.school_count != null ? req.school_count.toLocaleString() : "—",
    status: <StatusTag status={req.status} />,
  };
}

function DeletionLanding() {
  const [page, setPage] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deletion-requests", page, pageSize],
    queryFn: () =>
      api.delete
        .list_deletion_requests({ page, page_size: pageSize })
        .then(r => r.data),
  });

  const rows: TableRowData[] = (data?.data ?? []).map(toTableRow);
  const totalCount = data?.total_count ?? 0;

  return (
    <Section>
      <Section>
        <Stack gap={8}>
          <Stack gap={4}>
            <Heading>Deletion Requests</Heading>
            <p className="cds--label-description">
              History of all school deletion requests submitted via this portal.
            </p>
            <div>
              <Button as={Link} to="/delete/new" size="xl" renderIcon={Add}>
                New deletion request
              </Button>
            </div>
          </Stack>

          {isLoading ? (
            <DataTableSkeleton
              columnCount={columns.length}
              rowCount={pageSize}
            />
          ) : isError ? (
            <p className="text-giga-red">
              Failed to load deletion requests. Please try again.
            </p>
          ) : (
            <>
              <DataTable rows={rows} headers={columns} isSortable>
                {({
                  rows: tableRows,
                  headers,
                  getTableProps,
                  getHeaderProps,
                  getRowProps,
                }) => (
                  <TableContainer>
                    <Table {...getTableProps()} size="md">
                      <TableHead>
                        <TableRow>
                          {headers.map(header => (
                            <TableHeader
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              {...(getHeaderProps({ header }) as any)}
                              key={header.key}
                            >
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map(row => (
                          <TableRow {...getRowProps({ row })} key={row.id}>
                            {row.cells.map(cell => (
                              <TableCell key={cell.id}>{cell.value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                        {tableRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={columns.length}>
                              No deletion requests found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>

              <Pagination
                page={page}
                pageSize={pageSize}
                pageSizes={[10, 20, 50]}
                totalItems={totalCount}
                onChange={({ page: p, pageSize: ps }) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </>
          )}
        </Stack>
      </Section>
    </Section>
  );
}
