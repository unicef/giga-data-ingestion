import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Accordion,
  AccordionItem,
  Button,
  ButtonSet,
  DataTable,
  DataTableHeader,
  Loading,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { ErrorComponent } from "@/components/common/ErrorComponent.tsx";
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils.ts";
import { CarbonDataTableRow, KeyValueObject } from "@/types/datatable";
import { getValueByHeader } from "@/utils/approval_requests";
import { validateSearchParams } from "@/utils/pagination.ts";

export const Route = createFileRoute(
  "/approval-requests/$countryCode/$uploadId/confirm",
)({
  component: Confirm,
  validateSearch: validateSearchParams,
  errorComponent: ErrorComponent,
});

const headers: DataTableHeader[] = [
  { key: "school_id_giga", header: "school_id_giga" },
  { key: "_change_type", header: "_change_type" },
];

interface ConfirmDataTablesProps {
  rows: KeyValueObject[];
}

function Confirm() {
  const {
    approveRowState: { rows, approvedRows, rejectedRows, totalCount },
    approveRowActions: { resetApproveRowState },
  } = useStore();
  const { countryCode, uploadId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });

  const { mutateAsync: submit, isPending } = useMutation({
    mutationKey: ["approval-request-submit", countryCode, uploadId],
    mutationFn: api.approvalRequests.submit,
  });

  const approvedRowsList = rows.filter(row =>
    approvedRows.includes(row.school_id_giga as string),
  );
  const rejectedRowsList = rows.filter(row =>
    rejectedRows.includes(row.school_id_giga as string),
  );
  const pendingCount =
    totalCount - approvedRowsList.length - rejectedRowsList.length;

  const ConfirmDatatables = ({ rows }: ConfirmDataTablesProps) => (
    <DataTable headers={headers} rows={rows as CarbonDataTableRow}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <Table {...getTableProps()}>
          <TableHead>
            <TableRow>
              {headers.map(header => (
                // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                <TableHeader {...getHeaderProps({ header })}>
                  {header.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => {
              const changeType = getValueByHeader(row.cells, "_change_type");
              return (
                <TableRow
                  className={cn({
                    "bg-green-300": changeType === "INSERT",
                    "bg-yellow-200": changeType === "UPDATE",
                    "bg-red-300": changeType === "DELETE",
                  })}
                  {...getRowProps({ row })}
                >
                  {row.cells.map(cell => (
                    <TableCell key={cell.id}>
                      {typeof cell.value === "object" && cell.value !== null ? (
                        <>
                          <p className="line-through">
                            {(cell.value as { old: unknown }).old ?? "NULL"}
                          </p>
                          <p>
                            {(cell.value as { update: unknown }).update ??
                              "NULL"}
                          </p>
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
      )}
    </DataTable>
  );

  const handleSubmit = async () => {
    await submit({
      countryCode,
      uploadId,
      approved_rows: approvedRows,
      rejected_rows: rejectedRows,
    });
    resetApproveRowState();
    await navigate({
      to: "/approval-requests/$countryCode",
      params: { countryCode },
    });
  };

  return (
    <Section className="container py-6">
      <Accordion>
        <AccordionItem title={`Approved Rows (${approvedRowsList.length})`}>
          <ConfirmDatatables rows={approvedRowsList} />
        </AccordionItem>
        <AccordionItem title={`Rejected Rows (${rejectedRowsList.length})`}>
          <ConfirmDatatables rows={rejectedRowsList} />
        </AccordionItem>
        {pendingCount > 0 && (
          <AccordionItem title={`Remaining Pending (${pendingCount})`} disabled>
            <p>These rows were not actioned and will remain pending.</p>
          </AccordionItem>
        )}
      </Accordion>
      <Section level={8}>
        <p className="py-4">
          Approved rows will be scheduled for merging into the school master
          dataset. Rejected rows will be flagged as rejected. Rows left pending
          can be reviewed in a future session. Click submit to confirm.
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
              ? props => <Loading small withOverlay={false} {...props} />
              : ArrowRight
          }
          type="submit"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </ButtonSet>
    </Section>
  );
}
