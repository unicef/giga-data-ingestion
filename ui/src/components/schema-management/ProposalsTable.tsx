import { useMemo, useState } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  InlineNotification,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  TextArea,
} from "@carbon/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { api } from "@/api";
import {
  listSchemaDatasetsQueryOptions,
  listSchemaProposalsQueryOptions,
} from "@/api/queryOptions.ts";
import DiffViewer from "@/components/schema-management/DiffViewer.tsx";
import useRoles from "@/hooks/useRoles.ts";
import { ProposalDetail, ProposalStatus } from "@/types/schemaRegistry.ts";

const columns: DataTableHeader[] = [
  { key: "dataset", header: "Dataset" },
  { key: "column_name", header: "Column" },
  { key: "proposal_type", header: "Type" },
  { key: "status", header: "Status" },
  { key: "proposed_by_email", header: "Proposed by" },
  { key: "actions", header: "" },
];

const statusTagType: Record<
  ProposalStatus,
  "gray" | "green" | "red" | "magenta"
> = {
  pending: "gray",
  approved: "green",
  rejected: "red",
  apply_failed: "magenta",
};

function ProposalsTable() {
  const queryClient = useQueryClient();
  const { isPrivileged } = useRoles();
  const [diff, setDiff] = useState<ProposalDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: proposalsQuery, isLoading } = useSuspenseQuery(
    listSchemaProposalsQueryOptions,
  );
  const { data: datasetsQuery } = useSuspenseQuery(
    listSchemaDatasetsQueryOptions,
  );

  const proposals = useMemo(() => proposalsQuery?.data ?? [], [proposalsQuery]);
  const datasetKeyById = useMemo(
    () => new Map((datasetsQuery?.data ?? []).map(d => [d.id, d.key])),
    [datasetsQuery],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["schema-registry", "proposals"],
    });

  const { mutate: approve } = useMutation({
    mutationFn: api.schemaRegistry.approveProposal,
    onSuccess: invalidate,
    onError: () =>
      setErrorMessage(
        "Could not approve — you may not approve your own proposal.",
      ),
  });
  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: api.schemaRegistry.rejectProposal,
    onSuccess: () => {
      invalidate();
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const showDiff = async (id: string) => {
    const { data } = await api.schemaRegistry.getProposal(id);
    setDiff(data);
  };

  const rows = proposals.map(proposal => ({
    id: proposal.id,
    dataset: datasetKeyById.get(proposal.dataset_id) ?? proposal.dataset_id,
    column_name: proposal.column_name,
    proposal_type: proposal.proposal_type,
    status: <Tag type={statusTagType[proposal.status]}>{proposal.status}</Tag>,
    proposed_by_email: proposal.proposed_by_email,
    actions: (
      <div className="flex gap-2">
        <Button
          kind="ghost"
          size="sm"
          onClick={() => void showDiff(proposal.id)}
        >
          View diff
        </Button>
        {isPrivileged && proposal.status === "pending" && (
          <>
            <Button
              kind="tertiary"
              size="sm"
              onClick={() => approve(proposal.id)}
            >
              Approve
            </Button>
            <Button
              kind="danger--ghost"
              size="sm"
              onClick={() => setRejectTarget(proposal.id)}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    ),
  }));

  return (
    <>
      {errorMessage && (
        <InlineNotification
          kind="error"
          title="Approval failed"
          subtitle={errorMessage}
          onCloseButtonClick={() => setErrorMessage(null)}
        />
      )}
      <DataTable headers={columns} rows={isLoading ? [] : rows}>
        {({
          rows: tableRows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
        }) => (
          <TableContainer title="Schema change proposals">
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
                {tableRows.map(row => (
                  <TableRow {...getRowProps({ row })}>
                    {row.cells.map(cell => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <Modal
        aria-label="proposal diff modal"
        modalHeading={diff ? `Diff — ${diff.column_name}` : ""}
        open={diff !== null}
        passiveModal
        onRequestClose={() => setDiff(null)}
      >
        <DiffViewer diff={diff?.diff ?? []} />
        {diff?.apply_error && (
          <InlineNotification
            kind="error"
            title="Apply failed"
            subtitle={diff.apply_error}
            hideCloseButton
          />
        )}
        {diff?.rejection_reason && (
          <InlineNotification
            kind="info"
            title="Rejected"
            subtitle={diff.rejection_reason}
            hideCloseButton
          />
        )}
      </Modal>

      <Modal
        aria-label="reject proposal modal"
        modalHeading="Reject proposal"
        open={rejectTarget !== null}
        primaryButtonText="Reject"
        primaryButtonDisabled={rejectReason.trim().length === 0 || isRejecting}
        secondaryButtonText="Cancel"
        danger
        onRequestClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        onRequestSubmit={() => {
          if (rejectTarget) {
            reject({ id: rejectTarget, reason: rejectReason.trim() });
          }
        }}
      >
        <TextArea
          id="reject-reason"
          labelText="Reason"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  );
}

export default ProposalsTable;
