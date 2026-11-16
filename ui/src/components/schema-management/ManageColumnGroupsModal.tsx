import { useMemo, useState } from "react";

import {
  Button,
  InlineNotification,
  Modal,
  Tag,
  TextInput,
} from "@carbon/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { api } from "@/api";
import { RegistryColumn } from "@/types/schemaRegistry.ts";

interface ManageColumnGroupsModalProps {
  datasetKey: string;
  columns: RegistryColumn[];
  open: boolean;
  onClose: () => void;
}

function errorDetail(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as { detail?: string | string[] })
      ?.detail;
    if (Array.isArray(detail)) return detail.join(" ");
    if (typeof detail === "string") return detail;
  }
  if (error instanceof Error) return error.message;
  return "Could not update column group.";
}

function ManageColumnGroupsModal({
  datasetKey,
  columns,
  open,
  onClose,
}: ManageColumnGroupsModalProps) {
  const queryClient = useQueryClient();
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const column of columns) {
      const group = column.column_group?.trim();
      if (!group) continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [columns]);

  const invalidateSchemaQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "columns", datasetKey],
      }),
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "resolved", datasetKey],
      }),
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "versions", datasetKey],
      }),
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "datasets"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "dataset", datasetKey],
      }),
    ]);
  };

  const { mutateAsync: updateColumnGroup, isPending } = useMutation({
    mutationFn: api.schemaRegistry.updateColumnGroup,
  });

  const resetNested = () => {
    setRenameTarget(null);
    setDeleteTarget(null);
    setNewName("");
  };

  const handleClose = () => {
    resetNested();
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const openRename = (name: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDeleteTarget(null);
    setRenameTarget(name);
    setNewName(name);
  };

  const openDelete = (name: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRenameTarget(null);
    setDeleteTarget(name);
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === renameTarget) return;
    setErrorMessage(null);
    try {
      const { data } = await updateColumnGroup({
        datasetKey,
        body: {
          action: "rename",
          name: renameTarget,
          new_name: trimmed,
        },
      });
      await invalidateSchemaQueries();
      setSuccessMessage(
        `Renamed “${data.name}” to “${data.new_name}” on ${
          data.updated
        } column${data.updated === 1 ? "" : "s"}.`,
      );
      resetNested();
    } catch (error) {
      setErrorMessage(errorDetail(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setErrorMessage(null);
    try {
      const { data } = await updateColumnGroup({
        datasetKey,
        body: {
          action: "delete",
          name: deleteTarget,
        },
      });
      await invalidateSchemaQueries();
      setSuccessMessage(
        `Cleared group “${data.name}” from ${data.updated} column${
          data.updated === 1 ? "" : "s"
        }.`,
      );
      resetNested();
    } catch (error) {
      setErrorMessage(errorDetail(error));
    }
  };

  const renameCount =
    groups.find(group => group.name === renameTarget)?.count ?? 0;
  const deleteCount =
    groups.find(group => group.name === deleteTarget)?.count ?? 0;

  if (renameTarget) {
    return (
      <Modal
        aria-label="rename column group modal"
        open={open}
        modalHeading={`Rename “${renameTarget}”`}
        primaryButtonText={isPending ? "Saving…" : "Save"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={
          isPending || !newName.trim() || newName.trim() === renameTarget
        }
        onRequestClose={() => {
          if (!isPending) resetNested();
        }}
        onRequestSubmit={() => {
          void handleRename();
        }}
        onSecondarySubmit={() => {
          if (!isPending) resetNested();
        }}
      >
        <p className="mb-4 text-sm text-giga-dark-gray">
          {renameCount} column{renameCount === 1 ? "" : "s"} will be updated.
        </p>
        {errorMessage && (
          <InlineNotification
            className="mb-4"
            kind="error"
            title="Rename failed"
            subtitle={errorMessage}
            hideCloseButton
          />
        )}
        <TextInput
          id="rename-column-group"
          labelText="New name"
          value={newName}
          disabled={isPending}
          onChange={event => setNewName(event.target.value)}
        />
      </Modal>
    );
  }

  if (deleteTarget) {
    return (
      <Modal
        aria-label="delete column group modal"
        danger
        open={open}
        modalHeading={`Delete “${deleteTarget}”`}
        primaryButtonText={isPending ? "Deleting…" : "Delete group"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={isPending}
        onRequestClose={() => {
          if (!isPending) resetNested();
        }}
        onRequestSubmit={() => {
          void handleDelete();
        }}
        onSecondarySubmit={() => {
          if (!isPending) resetNested();
        }}
      >
        <p className="text-sm text-giga-dark-gray">
          This clears the group on {deleteCount} column
          {deleteCount === 1 ? "" : "s"}. They will appear under Other fields on
          the mapping screen.
        </p>
        {errorMessage && (
          <InlineNotification
            className="mt-4"
            kind="error"
            title="Delete failed"
            subtitle={errorMessage}
            hideCloseButton
          />
        )}
      </Modal>
    );
  }

  return (
    <Modal
      aria-label="manage column groups modal"
      open={open}
      modalHeading="Manage column groups"
      passiveModal
      onRequestClose={handleClose}
    >
      <p className="mb-4 text-sm text-giga-dark-gray">
        Renaming or deleting updates every owned column that uses the group.
      </p>
      {successMessage && (
        <InlineNotification
          className="mb-4"
          kind="success"
          title="Column groups updated"
          subtitle={successMessage}
          onCloseButtonClick={() => setSuccessMessage(null)}
        />
      )}
      {errorMessage && (
        <InlineNotification
          className="mb-4"
          kind="error"
          title="Update failed"
          subtitle={errorMessage}
          hideCloseButton
        />
      )}
      {groups.length === 0 ? (
        <p className="text-giga-dark-gray">
          No column groups yet. Assign a group on a column to create one.
        </p>
      ) : (
        <ul className="divide-y divide-carbon-datatable-grey">
          {groups.map(group => (
            <li
              key={group.name}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-semibold">{group.name}</span>
                <Tag type="cool-gray" size="sm">
                  {group.count} column{group.count === 1 ? "" : "s"}
                </Tag>
              </div>
              <div className="flex gap-1">
                <Button
                  kind="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => openRename(group.name)}
                >
                  Rename
                </Button>
                <Button
                  kind="danger--ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => openDelete(group.name)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default ManageColumnGroupsModal;
