import { ComponentProps } from "react";

import { ArrowLeft, ArrowRight } from "@carbon/icons-react";
import {
  Accordion,
  AccordionItem,
  Button,
  ButtonSet,
  DataTable,
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
import { useStore } from "@/context/store";
import { cn } from "@/lib/utils.ts";
import { getValueByHeader } from "@/utils/approve_row";

import { TransformedRow } from ".";

export const Route = createFileRoute("/approval-requests/$subpath/confirm")({
  component: Confirm,
});

interface ConfirmDataTablesProps {
  rows: TransformedRow[];
}

type CarbonDataTableRow = ComponentProps<typeof DataTable>["rows"];

function Confirm() {
  const {
    approveRowState: { headers, rows, approvedRowsList },
  } = useStore();
  const { subpath } = Route.useParams();

  const navigate = useNavigate({ from: Route.fullPath });

  const { mutateAsync: upload, isPending } = useMutation({
    mutationKey: ["approval-request-upload", subpath],
    mutationFn: api.approvalRequests.upload_approved_rows,
  });

  const approvedRows = rows.filter(obj =>
    approvedRowsList.includes(obj.id as string),
  );

  const rejectedRows = rows.filter(
    obj => !approvedRowsList.includes(obj.id as string),
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
    const approvedRowIds = approvedRows.map(row => row.id as string);
    await upload({
      approved_rows: approvedRowIds,
      subpath: subpath,
    });
    navigate({ to: "/approval-requests" });
  };

  const rejectedRowsLen = rows.length - approvedRows.length;
  return (
    <Section className="container py-6">
      <Accordion>
        <AccordionItem title={`Approved Rows (${approvedRows.length})`}>
          <ConfirmDatatables rows={approvedRows} />
        </AccordionItem>
        <AccordionItem title={`Rejected Rows (${rejectedRowsLen})`}>
          <ConfirmDatatables rows={rejectedRows} />
        </AccordionItem>
      </Accordion>
      <Section level={8}>
        <p className="py-4">
          The approved rows above will be scheduled for merging to the School
          Master Silver dataset, and the rejected rows will be dropped. Please
          double check and click submit to complete the review process.
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
        >
          Cancel
        </Button>
        <Button
          className="w-full"
          isExpressive
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
