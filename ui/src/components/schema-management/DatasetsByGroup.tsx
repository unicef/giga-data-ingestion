import { useMemo, useState } from "react";

import { Add } from "@carbon/icons-react";
import { Button, Search, Stack, Tile } from "@carbon/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { api } from "@/api";
import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import AddDatasetsToGroupModal from "@/components/schema-management/AddDatasetsToGroupModal.tsx";
import CreateGroupModal from "@/components/schema-management/CreateGroupModal.tsx";
import DatasetGroupSection from "@/components/schema-management/DatasetGroupSection.tsx";
import { DatasetGroup, SchemaDataset } from "@/types/schemaRegistry.ts";

const UNGROUPED = "__ungrouped__";

function DatasetsByGroup() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addToGroup, setAddToGroup] = useState<DatasetGroup | null>(null);

  const { data: datasetsQuery } = useSuspenseQuery(
    listSchemaDatasetsQueryOptions,
  );
  const { data: groupsQuery } = useSuspenseQuery(listDatasetGroupsQueryOptions);

  const datasets = useMemo(() => datasetsQuery?.data ?? [], [datasetsQuery]);
  const groups = useMemo(() => groupsQuery?.data ?? [], [groupsQuery]);

  const { mutate: moveDataset } = useMutation({
    mutationFn: api.schemaRegistry.moveDataset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "datasets"],
      });
    },
  });

  const filteredDatasets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return datasets;
    return datasets.filter(dataset =>
      dataset.key.toLowerCase().includes(query),
    );
  }, [datasets, search]);

  const datasetsByGroup = useMemo(() => {
    const map = new Map<string, SchemaDataset[]>();
    for (const dataset of filteredDatasets) {
      const key = dataset.group_id ?? UNGROUPED;
      const bucket = map.get(key);
      if (bucket) bucket.push(dataset);
      else map.set(key, [dataset]);
    }
    return map;
  }, [filteredDatasets]);

  const ungroupedCount = useMemo(
    () => datasets.filter(dataset => !dataset.group_id).length,
    [datasets],
  );
  const pendingTotal = useMemo(
    () =>
      datasets.reduce(
        (sum, dataset) => sum + dataset.pending_proposal_count,
        0,
      ),
    [datasets],
  );

  const handleMove = (datasetKey: string, groupId: string | null) =>
    moveDataset({ key: datasetKey, group_id: groupId });

  return (
    <Stack gap={6}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile className="flex flex-col gap-1">
          <span className="text-2xl font-semibold">{datasets.length}</span>
          <span className="text-xs text-giga-dark-gray">Datasets</span>
        </Tile>
        <Tile className="flex flex-col gap-1">
          <span className="text-2xl font-semibold">{groups.length}</span>
          <span className="text-xs text-giga-dark-gray">Groups</span>
        </Tile>
        <Tile className="flex flex-col gap-1">
          <span
            className={`text-2xl font-semibold ${
              ungroupedCount > 0 ? "text-giga-dark-yellow" : ""
            }`}
          >
            {ungroupedCount}
          </span>
          <span className="text-xs text-giga-dark-gray">Ungrouped</span>
        </Tile>
        <Tile className="flex flex-col gap-1">
          <span
            className={`text-2xl font-semibold ${
              pendingTotal > 0 ? "text-giga-dark-yellow" : ""
            }`}
          >
            {pendingTotal}
          </span>
          <span className="text-xs text-giga-dark-gray">Pending proposals</span>
        </Tile>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Search
          id="dataset-search"
          labelText="Search datasets"
          placeholder="Search datasets…"
          size="lg"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="flex-1" />
        <Button
          kind="ghost"
          renderIcon={Add}
          onClick={() => setCreateOpen(true)}
        >
          New group
        </Button>
      </div>

      <Stack gap={5}>
        {groups.map(group => (
          <DatasetGroupSection
            key={group.id}
            group={group}
            groups={groups}
            datasets={datasetsByGroup.get(group.id) ?? []}
            onAddDatasets={() => setAddToGroup(group)}
            onMove={handleMove}
          />
        ))}
        <DatasetGroupSection
          group={null}
          groups={groups}
          datasets={datasetsByGroup.get(UNGROUPED) ?? []}
          onMove={handleMove}
        />
      </Stack>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {addToGroup && (
        <AddDatasetsToGroupModal
          group={addToGroup}
          groups={groups}
          datasets={datasets}
          open={addToGroup !== null}
          onClose={() => setAddToGroup(null)}
        />
      )}
    </Stack>
  );
}

export default DatasetsByGroup;
