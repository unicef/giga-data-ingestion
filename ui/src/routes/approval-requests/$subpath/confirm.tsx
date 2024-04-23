import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Accordion,
  AccordionItem,
  Button,
  ButtonSet,
  DataTable,
  DataTableSkeleton,
  Loading,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { HEADERS } from "@/constants/ingest-api.ts";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils.ts";
import { CarbonDataTableRow } from "@/types/datatable";
import { KeyValueObject } from "@/types/datatable";
import { getValueByHeader } from "@/utils/approval_requests";
import { validateSearchParams } from "@/utils/pagination.ts";

export const Route = createFileRoute("/approval-requests/$subpath/confirm")({
  component: Confirm,
  validateSearch: validateSearchParams,
  loader: ({ params: { subpath }, context: { queryClient } }) => {
    return queryClient.ensureQueryData(
      queryOptions({
        queryFn: () =>
          api.approvalRequests.get(subpath, {
            page: DEFAULT_PAGE_NUMBER,
            page_size: DEFAULT_PAGE_SIZE,
          }),
        queryKey: [
          "approval-requests",
          subpath,
          DEFAULT_PAGE_NUMBER,
          DEFAULT_PAGE_SIZE,
        ],
      }),
    );
  },
  pendingComponent: () => (
    <Section className="container py-6">
      <DataTableSkeleton headers={HEADERS} />
    </Section>
  ),
  errorComponent: ErrorComponent,
});

interface ConfirmDataTablesProps {
  rows: KeyValueObject[];
}

function Confirm() {
  const {
    approveRowState: { headers, rows, approvedRowsList, rejectedRowsList },
    approveRowActions: { resetApproveRowState },
  } = useStore();
  const { subpath } = Route.useParams();

  const {
    page = DEFAULT_PAGE_NUMBER,
    page_size: pageSize = DEFAULT_PAGE_SIZE,
  } = Route.useSearch();

  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: {
      data: { total_count },
    },
  } = useSuspenseQuery(
    queryOptions({
      queryFn: () =>
        api.approvalRequests.get(subpath, { page: page, page_size: pageSize }),
      queryKey: ["approval-requests", subpath, page, pageSize],
    }),
  );

  const { mutateAsync: upload, isPending } = useMutation({
    mutationKey: ["approval-request-upload", subpath],
    mutationFn: api.approvalRequests.upload_approved_rows,
  });

  const approvedRows = rows.filter(obj =>
    approvedRowsList.includes(obj.id as string),
  );

  const rejectedRows = rows.filter(obj =>
    rejectedRowsList.includes(obj.id as string),
  );

  const ConfirmDatatables = ({ rows }: ConfirmDataTablesProps) => {
    return (
      <DataTable headers={headers} rows={rows as CarbonDataTableRow}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => {
          return (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                    <TableHeader
                      {...getHeaderProps({
                        header,
                      })}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const changeType = getValueByHeader(
                    row.cells,
                    "_change_type",
                  );
                  return (
                    <TableRow
                      className={cn({
                        "bg-green-300": changeType === "insert",
                        "bg-yellow-200": changeType === "update_preimage",
                      })}
                      {...getRowProps({
                        row,
                      })}
                    >
                      {row.cells.map(cell => (
                        <TableCell key={cell.id}>
                          {typeof cell.value === "object" ? (
                            <>
                              <p className="line-through">
                                {cell.value.old ?? "NULL"}
                              </p>
                              <p className="">{cell.value.update ?? "NULL"}</p>
                            </>
                          ) : (
                            cell.value
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          );
        }}
      </DataTable>
    );
  };

  const handleSubmit = async () => {
    await upload({
      approved_rows: approvedRowsList,
      subpath: subpath,
    });
    await navigate({ to: "/approval-requests" });
  };

  return (
    <Section className="container py-6">
      <Accordion>
        <AccordionItem
          disabled
          title={`Approved Rows (${approvedRowsList.length})`}
        >
          <ConfirmDatatables rows={approvedRows} />
        </AccordionItem>
        <AccordionItem
          disabled
          title={`Rejected Rows (${total_count - approvedRowsList.length})`}
        >
          <ConfirmDatatables rows={rejectedRows} />
        </AccordionItem>
      </Accordion>
      <Section level={8}>
        <p className="py-4">
          The approved rows above will be scheduled for merging to the School
          Master dataset, and the rejected rows will be dropped. Please double
          check and click submit to complete the review process.
        </p>
      </Section>
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
          disabled={isPending}
          renderIcon={
            isPending
              ? props => <Loading small={true} withOverlay={false} {...props} />
              : ArrowRight
          }
          type="submit"
          onClick={handleSubmit}
        >
          Approve
        </Button>
      </ButtonSet>
    </Section>
  );
}
