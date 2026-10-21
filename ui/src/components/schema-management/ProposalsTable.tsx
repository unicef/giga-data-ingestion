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
import { AxiosError } from "axios";

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

function approvalErrorMessage(error: unknown) {
  const detail =
    error instanceof AxiosError
      ? (error.response?.data as { detail?: string } | undefined)?.detail
      : undefined;

  return detail || "The proposal could not be approved.";
}

function ProposalsTable() {
  const queryClient = useQueryClient();
  const { isPrivileged } = useRoles();
  const [diff, setDiff] = useState<ProposalDetail | null>(null);
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    queryClient.invalidateQueries({ queryKey: ["schema-registry"] });

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: api.schemaRegistry.approveProposal,
    onSuccess: () => {
      invalidate();
      setDiff(null);
      setReviewActionError(null);
      setErrorMessage(null);
      setSuccessMessage(
        "Proposal approved and a new schema version published.",
      );
    },
    onError: (error, proposalId) => {
      const message = approvalErrorMessage(error);
      if (diff?.id === proposalId) {
        setReviewActionError(message);
      } else {
        setErrorMessage(message);
      }
    },
  });
  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: api.schemaRegistry.rejectProposal,
    onSuccess: () => {
      invalidate();
      setRejectTarget(null);
      setRejectReason("");
      setDiff(null);
      setReviewActionError(null);
      setErrorMessage(null);
      setSuccessMessage("Proposal rejected.");
    },
    onError: () => setErrorMessage("Could not reject this proposal."),
  });

  const showDiff = async (id: string) => {
    setReviewTarget(id);
    setErrorMessage(null);
    setReviewActionError(null);
    setSuccessMessage(null);
    try {
      const { data } = await api.schemaRegistry.getProposal(id);
      setDiff(data);
    } catch {
      setErrorMessage("Could not load the proposal details.");
    } finally {
      setReviewTarget(null);
    }
  };

  const openRejectModal = (id: string) => {
    setDiff(null);
    setReviewActionError(null);
    setRejectTarget(id);
    setRejectReason("");
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
          disabled={reviewTarget === proposal.id}
          onClick={() => void showDiff(proposal.id)}
        >
          {proposal.status === "pending" ? "Review" : "View"}
        </Button>
        {isPrivileged && proposal.status === "pending" && (
          <>
            <Button
              kind="ghost"
              size="sm"
              disabled={isApproving}
              onClick={() => approve(proposal.id)}
            >
              Approve
            </Button>
            <Button
              kind="danger--ghost"
              size="sm"
              onClick={() => openRejectModal(proposal.id)}
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
          title="Proposal action failed"
          subtitle={errorMessage}
          onCloseButtonClick={() => setErrorMessage(null)}
        />
      )}
      {successMessage && (
        <InlineNotification
          kind="success"
          title={successMessage}
          onCloseButtonClick={() => setSuccessMessage(null)}
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
        modalHeading={diff ? `Review change — ${diff.column_name}` : ""}
        open={diff !== null}
        passiveModal
        onRequestClose={() => {
          setDiff(null);
          setReviewActionError(null);
        }}
      >
        {reviewActionError && (
          <InlineNotification
            className="mb-4"
            kind="error"
            title="Approval failed"
            subtitle={reviewActionError}
            onCloseButtonClick={() => setReviewActionError(null)}
          />
        )}
        {diff && (
          <div className="mb-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <p>
              <span className="font-semibold">Dataset:</span>{" "}
              {datasetKeyById.get(diff.dataset_id) ?? diff.dataset_id}
            </p>
            <p>
              <span className="font-semibold">Change:</span>{" "}
              {diff.proposal_type}
            </p>
            <p>
              <span className="font-semibold">Proposed by:</span>{" "}
              {diff.proposed_by_email}
            </p>
          </div>
        )}
        {diff && diff.affected_schema_keys.length > 0 && (
          <InlineNotification
            className="mb-4"
            kind="warning"
            title={`Core change affects ${diff.affected_schema_keys.length} member schemas`}
            subtitle={diff.affected_schema_keys.join(", ")}
            hideCloseButton
          />
        )}
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
        {diff && isPrivileged && diff.status === "pending" && (
          <div className="mt-6 flex justify-end gap-3">
            <Button
              kind="secondary"
              onClick={() => {
                setDiff(null);
                setReviewActionError(null);
              }}
            >
              Close
            </Button>
            <Button
              kind="danger--tertiary"
              onClick={() => openRejectModal(diff.id)}
            >
              Reject
            </Button>
            <Button disabled={isApproving} onClick={() => approve(diff.id)}>
              {isApproving ? "Approving…" : "Approve"}
            </Button>
          </div>
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
