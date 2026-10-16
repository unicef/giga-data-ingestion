import { useMemo, useState } from "react";

import { Button, Heading, Section, Tag } from "@carbon/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { schemaGroupDetailQueryOptions } from "@/api/queryOptions.ts";
import AddSchemaModal from "@/components/schema-management/AddSchemaModal.tsx";
import SchemaNavigator from "@/components/schema-management/SchemaNavigator.tsx";
import useRoles from "@/hooks/useRoles.ts";
import { SchemaDataset } from "@/types/schemaRegistry.ts";

function SchemaRow({
  schema,
  coreColumnCount,
}: {
  schema: SchemaDataset;
  coreColumnCount?: number;
}) {
  return (
    <Link
      className="grid min-w-0 grid-cols-[minmax(12rem,1.5fr)_minmax(5rem,.5fr)_minmax(6rem,.6fr)_auto] items-center gap-4 border-b border-carbon-datatable-grey bg-white px-4 py-4 text-giga-black no-underline last:border-b-0 hover:bg-giga-light-blue"
      to="/schema-management/$datasetKey"
      params={{ datasetKey: schema.key }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <b>{schema.name}</b>
          <Tag type="teal">Member</Tag>
          <Tag type="cool-gray">
            {schema.current_version_number
              ? `v${schema.current_version_number}`
              : "Unpublished"}
          </Tag>
        </div>
        <code className="text-xs text-giga-dark-gray">{schema.key}</code>
      </div>
      <span className="text-sm">{schema.column_count} own</span>
      <span className="text-sm">{coreColumnCount ?? 0} inherited</span>
      <div className="flex items-center gap-3">
        {schema.pending_proposal_count > 0 ? (
          <Tag type="warm-gray">{schema.pending_proposal_count} pending</Tag>
        ) : (
          <span className="text-xs text-giga-dark-gray">No pending</span>
        )}
        <span className="text-lg text-giga-blue">›</span>
      </div>
    </Link>
  );
}

function SchemaGroupDetail({ groupKey }: { groupKey: string }) {
  const [search, setSearch] = useState("");
  const [addSchemaOpen, setAddSchemaOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isPrivileged } = useRoles();
  const {
    data: { data: group },
  } = useSuspenseQuery(schemaGroupDetailQueryOptions(groupKey));
  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return group.member_schemas;
    return group.member_schemas.filter(schema =>
      [schema.name, schema.key, schema.description]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(normalizedSearch)),
    );
  }, [group.member_schemas, search]);

  return (
    <Section className="container py-6">
      <div className="grid min-w-0 grid-cols-1 gap-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SchemaNavigator activeGroupKey={group.key} />
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm">
                <Link className="cds--link" to="/schema-management">
                  Schema groups
                </Link>
                <span>/</span>
                <span className="text-giga-dark-gray">{group.name}</span>
              </div>
              <Heading>{group.name}</Heading>
              <p className="mt-2 text-giga-dark-gray">
                {group.description ?? "Related governed schemas."}
              </p>
            </div>
            {isPrivileged && (
              <div className="flex flex-wrap gap-2">
                <Button
                  as={Link}
                  kind="tertiary"
                  to="/schema-management/groups"
                >
                  Group settings
                </Button>
                <Button onClick={() => setAddSchemaOpen(true)}>
                  Add schema
                </Button>
              </div>
            )}
          </div>

          {group.core_schema ? (
            <section className="border-t-4 border-giga-blue bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Tag type="blue">Shared core schema</Tag>
                  <Tag type="cool-gray" className="ml-2">
                    {group.core_schema.current_version_number
                      ? `v${group.core_schema.current_version_number}`
                      : "Unpublished"}
                  </Tag>
                  <Heading className="mt-3 text-xl">
                    {group.core_schema.name}
                  </Heading>
                  <p className="mt-1 text-sm text-giga-dark-gray">
                    {group.core_schema.column_count} shared columns inherited by{" "}
                    {group.member_schemas.length} member schema
                    {group.member_schemas.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <Button
                  as={Link}
                  kind="tertiary"
                  to="/schema-management/$datasetKey"
                  params={{ datasetKey: group.core_schema.key }}
                >
                  View core columns
                </Button>
              </div>
            </section>
          ) : (
            <div className="border-l-4 border-giga-yellow bg-white p-4">
              <b>No core schema.</b>{" "}
              <span className="text-giga-dark-gray">
                Members in this group are currently applied independently.
              </span>
            </div>
          )}

          <section className="mt-7">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Heading className="text-xl">Schemas in this group</Heading>
                <p className="mt-1 text-sm text-giga-dark-gray">
                  Select a schema to view and change its columns.
                </p>
              </div>
              <label>
                <span className="sr-only">Search schemas</span>
                <input
                  className="h-10 min-w-64 border-0 border-b border-giga-gray bg-white px-3"
                  placeholder="Search schemas"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
              </label>
            </div>
            <div className="border border-carbon-datatable-grey">
              {filteredMembers.map(schema => (
                <SchemaRow
                  key={schema.id}
                  schema={schema}
                  coreColumnCount={group.core_schema?.column_count}
                />
              ))}
              {filteredMembers.length === 0 && (
                <p className="bg-white p-4 text-giga-dark-gray">
                  No member schemas match this search.
                </p>
              )}
            </div>
          </section>
          <AddSchemaModal
            groupId={group.id}
            open={addSchemaOpen}
            onClose={() => setAddSchemaOpen(false)}
            onCreated={async dataset => {
              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: ["schema-registry", "groups"],
                }),
                queryClient.invalidateQueries({
                  queryKey: ["schema-registry", "datasets"],
                }),
              ]);
              void navigate({
                to: "/schema-management/$datasetKey",
                params: { datasetKey: dataset.key },
              });
            }}
          />
        </div>
      </div>
    </Section>
  );
}

export default SchemaGroupDetail;
