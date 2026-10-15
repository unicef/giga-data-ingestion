import { useMemo } from "react";

import { Button, DataTableSkeleton, Tag } from "@carbon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";
import useRoles from "@/hooks/useRoles.ts";

function DatasetsTable() {
  const { isPrivileged } = useRoles();

  const { data: datasetsQuery, isLoading } = useSuspenseQuery(
    listSchemaDatasetsQueryOptions,
  );
  const { data: groupsQuery } = useSuspenseQuery(listDatasetGroupsQueryOptions);

  const datasets = useMemo(() => datasetsQuery?.data ?? [], [datasetsQuery]);
  const groups = useMemo(() => groupsQuery?.data ?? [], [groupsQuery]);

  if (isLoading) return <DataTableSkeleton />;

  const ungroupedDatasets = datasets.filter(dataset => !dataset.group_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-end gap-2">
        {isPrivileged && (
          <Button as={Link} kind="tertiary" to="/schema-management/groups">
            Manage groups
          </Button>
        )}
        <Button as={Link} kind="secondary" to="/schema-management/proposals">
          Review proposals
        </Button>
        {isPrivileged && (
          <Button as={Link} kind="ghost" to="/schema-management/audit">
            Audit log
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map(group => {
          const groupDatasets = datasets.filter(
            dataset => dataset.group_id === group.id,
          );
          const coreSchema = groupDatasets.find(
            dataset => dataset.role === "core",
          );
          const memberSchemas = groupDatasets.filter(
            dataset => dataset.role === "member",
          );
          const pendingProposalCount = groupDatasets.reduce(
            (total, dataset) => total + dataset.pending_proposal_count,
            0,
          );

          return (
            <Link
              key={group.id}
              className="border-l-4 border-giga-blue bg-white p-5 text-giga-black no-underline hover:bg-giga-light-blue"
              to="/schema-management/groups/$groupKey"
              params={{ groupKey: group.key }}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Tag type={coreSchema ? "blue" : "gray"}>
                  {coreSchema ? "Has core schema" : "No core schema"}
                </Tag>
                {pendingProposalCount > 0 && (
                  <Tag type="warm-gray">{pendingProposalCount} pending</Tag>
                )}
              </div>
              <h3 className="mb-1 text-xl font-semibold">{group.name}</h3>
              <p className="min-h-10 text-sm text-giga-dark-gray">
                {group.description ?? "Related governed schemas."}
              </p>
              <p className="mt-4 text-xs text-giga-dark-gray">
                {memberSchemas.length} member schema
                {memberSchemas.length === 1 ? "" : "s"}
                {coreSchema ? ` · core: ${coreSchema.name}` : ""}
              </p>
            </Link>
          );
        })}
      </div>

      {ungroupedDatasets.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg">Needs grouping</h3>
          <p className="mb-3 text-sm text-giga-dark-gray">
            These existing schemas must be assigned during the reviewed
            migration.
          </p>
          <div className="flex flex-wrap gap-2">
            {ungroupedDatasets.map(dataset => (
              <Button
                key={dataset.id}
                as={Link}
                kind="ghost"
                size="sm"
                to="/schema-management/$datasetKey"
                params={{ datasetKey: dataset.key }}
              >
                {dataset.name}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DatasetsTable;
