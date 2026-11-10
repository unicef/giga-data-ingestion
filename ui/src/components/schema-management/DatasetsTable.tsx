import { useMemo, useState } from "react";

import {
  Button,
  Checkbox,
  DataTableSkeleton,
  Heading,
  Search,
  Tag,
} from "@carbon/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import CreateGroupModal from "@/components/schema-management/CreateGroupModal.tsx";
import LifecycleActions from "@/components/schema-management/LifecycleActions.tsx";
import useRoles from "@/hooks/useRoles.ts";

function DatasetsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { isPrivileged } = useRoles();

  const { data: datasetsQuery, isLoading } = useSuspenseQuery(
    listSchemaDatasetsQueryOptions,
  );
  const { data: groupsQuery } = useSuspenseQuery(listDatasetGroupsQueryOptions);
  const activeDatasets = useMemo(
    () => datasetsQuery?.data ?? [],
    [datasetsQuery],
  );
  const activeGroups = useMemo(() => groupsQuery?.data ?? [], [groupsQuery]);

  const { data: archivedGroupsQuery } = useQuery({
    queryKey: ["schema-registry", "groups", "including-archived"],
    queryFn: () => api.schemaRegistry.listGroups(true),
    enabled: isPrivileged && showArchived,
  });
  const { data: archivedDatasetsQuery } = useQuery({
    queryKey: ["schema-registry", "datasets", "including-archived"],
    queryFn: () => api.schemaRegistry.listDatasets(true),
    enabled: isPrivileged && showArchived,
  });
  const datasets = useMemo(
    () =>
      showArchived
        ? archivedDatasetsQuery?.data ?? activeDatasets
        : activeDatasets,
    [activeDatasets, archivedDatasetsQuery, showArchived],
  );
  const groups = useMemo(
    () =>
      showArchived ? archivedGroupsQuery?.data ?? activeGroups : activeGroups,
    [activeGroups, archivedGroupsQuery, showArchived],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const visibleGroups = groups.filter(group => {
    if (!normalizedSearch) return true;
    const groupMatches = [group.name, group.key, group.description]
      .filter(Boolean)
      .some(value => value?.toLowerCase().includes(normalizedSearch));
    const schemaMatches = datasets
      .filter(dataset => dataset.group_id === group.id)
      .some(dataset =>
        [dataset.name, dataset.key].some(value =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      );
    return groupMatches || schemaMatches;
  });

  if (isLoading) return <DataTableSkeleton />;

  const coreSchemaCount = activeDatasets.filter(
    dataset => dataset.role === "core",
  ).length;
  const memberSchemaCount = activeDatasets.filter(
    dataset => dataset.role === "member",
  ).length;
  const pendingProposalCount = activeDatasets.reduce(
    (total, dataset) => total + dataset.pending_proposal_count,
    0,
  );

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Heading>Schema groups</Heading>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPrivileged && (
            <Button onClick={() => setCreateGroupOpen(true)}>
              Add Schema Group
            </Button>
          )}
          <Button as={Link} kind="secondary" to="/schema-management/proposals">
            Review proposals
          </Button>
          {isPrivileged && (
            <Button as={Link} kind="tertiary" to="/schema-management/audit">
              Audit log
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 border border-carbon-datatable-grey bg-white md:grid-cols-4">
        <div className="border-b border-r border-carbon-datatable-grey p-5 md:border-b-0">
          <strong className="block text-2xl font-semibold">
            {activeGroups.length}
          </strong>
          <span className="text-xs text-giga-dark-gray">Schema groups</span>
        </div>
        <div className="border-b border-carbon-datatable-grey p-5 md:border-b-0 md:border-r">
          <strong className="block text-2xl font-semibold">
            {coreSchemaCount}
          </strong>
          <span className="text-xs text-giga-dark-gray">Core schemas</span>
        </div>
        <div className="border-r border-carbon-datatable-grey p-5">
          <strong className="block text-2xl font-semibold">
            {memberSchemaCount}
          </strong>
          <span className="text-xs text-giga-dark-gray">
            Member {memberSchemaCount === 1 ? "schema" : "schemas"}
          </span>
        </div>
        <Link
          className="group relative p-5 text-giga-black no-underline hover:bg-giga-light-yellow"
          to="/schema-management/proposals"
        >
          <strong className="block text-2xl font-semibold text-giga-dark-yellow">
            {pendingProposalCount}
          </strong>
          <span className="text-xs text-giga-dark-gray">
            Pending {pendingProposalCount === 1 ? "proposal" : "proposals"}
          </span>
          <span className="absolute bottom-5 right-5 text-xs font-semibold text-giga-dark-blue opacity-0 transition-opacity group-hover:opacity-100">
            View →
          </span>
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading className="text-xl">Groups ({visibleGroups.length})</Heading>
        <div className="flex flex-wrap items-center gap-4">
          <Search
            id="schema-group-search"
            className="w-80 max-w-full"
            labelText="Search schema groups or schemas"
            placeholder="Search groups or schemas"
            size="lg"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          {isPrivileged && (
            <Checkbox
              id="show-archived-schema-groups"
              labelText="Show archived"
              checked={showArchived}
              onChange={(_, { checked }) => setShowArchived(Boolean(checked))}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleGroups.map(group => {
          const groupDatasets = datasets.filter(
            dataset => dataset.group_id === group.id,
          );
          const coreSchema = groupDatasets.find(
            dataset => dataset.role === "core",
          );
          const memberSchemas = groupDatasets.filter(
            dataset => dataset.role === "member",
          );
          const groupPendingCount = groupDatasets.reduce(
            (total, dataset) => total + dataset.pending_proposal_count,
            0,
          );
          const isArchivedGroup = group.archived_at != null;
          const openGroup = () => {
            if (isArchivedGroup) return;
            void navigate({
              to: "/schema-management/groups/$groupKey",
              params: { groupKey: group.key },
            });
          };

          return (
            <div
              key={group.id}
              role={isArchivedGroup ? undefined : "link"}
              tabIndex={isArchivedGroup ? undefined : 0}
              className={`border border-carbon-datatable-grey bg-white p-6 transition-shadow ${
                isArchivedGroup
                  ? "opacity-80"
                  : "cursor-pointer hover:shadow-md"
              }`}
              onClick={openGroup}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openGroup();
                }
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {isArchivedGroup && <Tag type="gray">Archived</Tag>}
                  {groupPendingCount > 0 && (
                    <Tag type="warm-gray">{groupPendingCount} pending</Tag>
                  )}
                </div>
                {isPrivileged && (
                  <div
                    onClick={event => event.stopPropagation()}
                    onKeyDown={event => event.stopPropagation()}
                  >
                    <LifecycleActions
                      resourceType="group"
                      resourceKey={group.key}
                      archived={isArchivedGroup}
                      compact
                      onChanged={() => undefined}
                    />
                  </div>
                )}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-giga-black">
                {group.name}
              </h3>
              <p className="min-h-12 text-sm leading-5 text-giga-dark-gray">
                {group.description ?? "Related governed schemas."}
              </p>
              <div className="mt-5 flex flex-wrap gap-4 border-t border-carbon-datatable-grey pt-4 text-xs text-giga-dark-gray">
                <span>
                  {memberSchemas.length} member{" "}
                  {memberSchemas.length === 1 ? "schema" : "schemas"}
                </span>
                {coreSchema && (
                  <span>{coreSchema.column_count} shared columns</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
    </div>
  );
}

export default DatasetsTable;
