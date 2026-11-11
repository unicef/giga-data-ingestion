import { useMemo, useState } from "react";

import { Checkbox, Modal, Search, Stack } from "@carbon/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import { DatasetGroup, SchemaDataset } from "@/types/schemaRegistry.ts";

interface AddDatasetsToGroupModalProps {
  group: DatasetGroup;
  groups: DatasetGroup[];
  datasets: SchemaDataset[];
  open: boolean;
  onClose: () => void;
}

function AddDatasetsToGroupModal({
  group,
  datasets,
  open,
  onClose,
}: AddDatasetsToGroupModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidates = useMemo(
    () => datasets.filter(dataset => dataset.group_id !== group.id),
    [datasets, group.id],
  );

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return candidates;
    return candidates.filter(
      dataset =>
        dataset.key.toLowerCase().includes(query) ||
        dataset.name.toLowerCase().includes(query),
    );
  }, [candidates, search]);

  const { mutateAsync: moveDataset, isPending } = useMutation({
    mutationFn: api.schemaRegistry.moveDataset,
  });

  const handleClose = () => {
    setSearch("");
    setSelected(new Set());
    onClose();
  };

  const toggle = (key: string) => {
    setSelected(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    await Promise.all(
      [...selected].map(key =>
        moveDataset({ key, group_id: group.id, role: "member" }),
      ),
    );
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "datasets"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["schema-registry", "groups"],
      }),
    ]);
    handleClose();
  };

  return (
    <Modal
      aria-label="add datasets to group modal"
      modalHeading={`Add datasets to ${group.name}`}
      open={open}
      primaryButtonText="Add selected"
      primaryButtonDisabled={selected.size === 0 || isPending}
      secondaryButtonText="Cancel"
      onRequestClose={handleClose}
      onRequestSubmit={handleSubmit}
    >
      <Stack gap={5}>
        <Search
          id="add-datasets-search"
          labelText="Search datasets"
          placeholder="Search datasets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filteredCandidates.length === 0 ? (
          <p className="text-sm text-giga-dark-gray">
            No datasets available to add.
          </p>
        ) : (
          <Stack gap={3}>
            {filteredCandidates.map(dataset => (
              <Checkbox
                key={dataset.id}
                id={`add-dataset-${dataset.id}`}
                labelText={`${dataset.name} (${dataset.key})`}
                checked={selected.has(dataset.key)}
                onChange={() => toggle(dataset.key)}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}

export default AddDatasetsToGroupModal;
