import { InlineNotification, Modal, Stack, Tag } from "@carbon/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { api } from "@/api";

interface PromoteColumnModalProps {
  datasetKey: string;
  columnName: string | null;
  onClose: () => void;
  onCreated: () => void;
}

function mutationError(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as { detail?: string | string[] })
      ?.detail;
    return Array.isArray(detail) ? detail.join(" ") : detail;
  }
  return "The promotion proposal could not be created.";
}

function PromoteColumnModal({
  datasetKey,
  columnName,
  onClose,
  onCreated,
}: PromoteColumnModalProps) {
  const queryClient = useQueryClient();
  const { data: previewQuery, isLoading } = useQuery({
    queryKey: ["schema-registry", "promotion-preview", datasetKey, columnName],
    queryFn: () =>
      api.schemaRegistry.getPromotionPreview({
        datasetKey,
        columnName: columnName as string,
      }),
    enabled: columnName !== null,
  });
  const preview = previewQuery?.data;
  const createPromotion = useMutation({
    mutationFn: () =>
      api.schemaRegistry.createProposal({
        datasetKey,
        body: {
          column_name: columnName as string,
          proposal_type: "promote",
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "proposals"],
      });
      onCreated();
    },
  });

  return (
    <Modal
      aria-label="promote column to core"
      modalHeading={
        columnName ? `Promote ${columnName} to the core schema` : ""
      }
      open={columnName !== null}
      primaryButtonText={
        createPromotion.isPending ? "Creating proposal…" : "Create proposal"
      }
      primaryButtonDisabled={
        isLoading || !preview?.can_promote || createPromotion.isPending
      }
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={() => createPromotion.mutate()}
    >
      <Stack gap={4}>
        {preview && (
          <>
            <p>
              This will add <b>{preview.column.name}</b> to{" "}
              <b>{preview.core_schema_key}</b> and remove identical member-owned
              copies when the proposal is approved.
            </p>
            <div>
              <b>Current owners</b>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.owners.map(owner => (
                  <Tag
                    key={owner.key}
                    type={owner.definition_matches ? "teal" : "red"}
                  >
                    {owner.key}
                  </Tag>
                ))}
              </div>
            </div>
            <p className="text-sm text-giga-dark-gray">
              {preview.affected_member_keys.length} member schema
              {preview.affected_member_keys.length === 1 ? "" : "s"} will
              inherit the promoted column.
            </p>
            {preview.blockers.map(blocker => (
              <InlineNotification
                key={blocker}
                kind="error"
                title="Promotion blocked"
                subtitle={blocker}
                hideCloseButton
              />
            ))}
          </>
        )}
        {createPromotion.error && (
          <InlineNotification
            kind="error"
            title="Could not create promotion proposal"
            subtitle={mutationError(createPromotion.error)}
            hideCloseButton
          />
        )}
      </Stack>
    </Modal>
  );
}

export default PromoteColumnModal;
