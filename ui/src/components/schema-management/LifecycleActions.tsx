import { useState } from "react";

import {
  Button,
  InlineNotification,
  Modal,
  Stack,
  TextArea,
} from "@carbon/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { api } from "@/api";

interface LifecycleActionsProps {
  resourceType: "dataset" | "group";
  resourceKey: string;
  archived: boolean;
  onChanged: () => void;
  compact?: boolean;
}

function errorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as { detail?: string | string[] })
      ?.detail;
    return Array.isArray(detail) ? detail.join(" ") : detail;
  }
  return "The lifecycle action could not be completed.";
}

function LifecycleActions({
  resourceType,
  resourceKey,
  archived,
  onChanged,
  compact = false,
}: LifecycleActionsProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"archive" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: previewQuery } = useQuery({
    queryKey: ["schema-registry", "lifecycle", resourceType, resourceKey],
    queryFn: () =>
      resourceType === "dataset"
        ? api.schemaRegistry.getDatasetLifecycle(resourceKey)
        : api.schemaRegistry.getGroupLifecycle(resourceKey),
  });
  const preview = previewQuery?.data;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["schema-registry"] });
    setAction(null);
    setReason("");
    setError(null);
    onChanged();
  };

  const archiveMutation = useMutation({
    mutationFn: () =>
      resourceType === "dataset"
        ? api.schemaRegistry.archiveDataset({ key: resourceKey, reason })
        : api.schemaRegistry.archiveGroup({ key: resourceKey, reason }),
    onSuccess: refresh,
    onError: mutationError => setError(errorMessage(mutationError) ?? ""),
  });
  const restoreMutation = useMutation({
    mutationFn: () =>
      resourceType === "dataset"
        ? api.schemaRegistry.restoreDataset(resourceKey)
        : api.schemaRegistry.restoreGroup(resourceKey),
    onSuccess: refresh,
    onError: mutationError => setError(errorMessage(mutationError) ?? ""),
  });
  const deleteMutation = useMutation({
    mutationFn: () =>
      resourceType === "dataset"
        ? api.schemaRegistry.deleteDataset(resourceKey)
        : api.schemaRegistry.deleteGroup(resourceKey),
    onSuccess: refresh,
    onError: mutationError => setError(errorMessage(mutationError) ?? ""),
  });

  const resourceLabel = resourceType === "dataset" ? "schema" : "schema group";
  const isPending =
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    deleteMutation.isPending;
  const openAction = (nextAction: "archive" | "delete") => {
    setError(null);
    setAction(nextAction);
  };

  return (
    <>
      {compact ? (
        <details
          className="relative"
          onClick={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
        >
          <summary
            className="flex h-8 w-8 cursor-pointer list-none items-center justify-center text-lg text-giga-dark-gray hover:bg-giga-light-gray"
            aria-label={`${resourceLabel} actions`}
          >
            •••
          </summary>
          <div className="absolute right-0 z-10 min-w-36 border border-carbon-datatable-grey bg-white shadow-md">
            <button
              className="block w-full border-0 bg-white px-4 py-3 text-left text-sm hover:bg-giga-light-gray disabled:text-giga-gray"
              disabled={isPending}
              onClick={() =>
                archived ? restoreMutation.mutate() : openAction("archive")
              }
            >
              {archived ? "Restore" : "Archive"}
            </button>
            {preview?.can_delete && (
              <button
                className="block w-full border-0 bg-white px-4 py-3 text-left text-sm text-giga-red hover:bg-giga-light-red disabled:text-giga-gray"
                disabled={isPending}
                onClick={() => openAction("delete")}
              >
                Delete draft
              </button>
            )}
          </div>
        </details>
      ) : (
        <div className="flex flex-wrap gap-2">
          {archived ? (
            <Button
              kind="tertiary"
              disabled={isPending}
              onClick={() => restoreMutation.mutate()}
            >
              Restore
            </Button>
          ) : (
            <Button
              kind="danger--tertiary"
              disabled={isPending}
              onClick={() => openAction("archive")}
            >
              Archive
            </Button>
          )}
          {preview?.can_delete && (
            <Button
              kind="danger--ghost"
              disabled={isPending}
              onClick={() => openAction("delete")}
            >
              Delete draft
            </Button>
          )}
        </div>
      )}

      {error && action === null && (
        <InlineNotification
          className="mt-3"
          kind="error"
          title="Lifecycle action failed"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
        />
      )}

      <Modal
        aria-label={`${action ?? "lifecycle"} ${resourceLabel}`}
        danger
        modalHeading={
          action === "delete"
            ? `Permanently delete draft ${resourceLabel}?`
            : `Archive ${resourceLabel}?`
        }
        open={action !== null}
        primaryButtonText={action === "delete" ? "Delete draft" : "Archive"}
        primaryButtonDisabled={
          isPending ||
          (action === "archive" && preview?.can_archive === false) ||
          (action === "delete" && preview?.can_delete === false)
        }
        secondaryButtonText="Cancel"
        onRequestClose={() => {
          setAction(null);
          setError(null);
        }}
        onRequestSubmit={() => {
          if (action === "archive") archiveMutation.mutate();
          if (action === "delete") deleteMutation.mutate();
        }}
      >
        <Stack gap={4}>
          <p>
            {action === "delete"
              ? "This is only available for unpublished, unreferenced drafts and cannot be undone."
              : "Versions and historical upload pins will be preserved."}
          </p>
          {action === "archive" && (
            <TextArea
              id={`${resourceType}-archive-reason`}
              labelText="Reason (optional)"
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          )}
          {preview && (
            <p className="text-sm text-giga-dark-gray">
              {preview.version_count} versions · {preview.proposal_count}{" "}
              proposals · {preview.upload_count} uploads
            </p>
          )}
          {preview?.blockers.map(blocker => (
            <InlineNotification
              key={blocker}
              kind="warning"
              title="Action blocked"
              subtitle={blocker}
              hideCloseButton
            />
          ))}
          {error && (
            <InlineNotification
              kind="error"
              title="Action failed"
              subtitle={error}
              onCloseButtonClick={() => setError(null)}
            />
          )}
        </Stack>
      </Modal>
    </>
  );
}

export default LifecycleActions;
