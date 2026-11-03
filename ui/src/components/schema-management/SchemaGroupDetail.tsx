import { useMemo, useState } from "react";

import {
  Button,
  Heading,
  InlineNotification,
  Section,
  Select,
  SelectItem,
  Tag,
} from "@carbon/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
  schemaGroupDetailQueryOptions,
} from "@/api/queryOptions.ts";
import AddDatasetsToGroupModal from "@/components/schema-management/AddDatasetsToGroupModal.tsx";
import AddSchemaModal from "@/components/schema-management/AddSchemaModal.tsx";
import LifecycleActions from "@/components/schema-management/LifecycleActions.tsx";
import SchemaNavigator from "@/components/schema-management/SchemaNavigator.tsx";
import useRoles from "@/hooks/useRoles.ts";
import {
  DatasetGroup,
  SchemaDataset,
  SchemaRole,
} from "@/types/schemaRegistry.ts";

function SchemaRow({
  schema,
  coreColumnCount,
  groups,
  isPrivileged,
  onMove,
}: {
  schema: SchemaDataset;
  coreColumnCount?: number;
  groups: DatasetGroup[];
  isPrivileged: boolean;
  onMove: (
    datasetKey: string,
    groupId: string | null,
    role?: SchemaRole,
  ) => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(12rem,1.5fr)_minmax(5rem,.5fr)_minmax(6rem,.6fr)_auto] items-center gap-4 border-b border-carbon-datatable-grey bg-white px-4 py-4 text-giga-black no-underline last:border-b-0 hover:bg-giga-light-blue">
      <div className="min-w-0">
        <Link
          className="font-semibold text-giga-black no-underline hover:text-giga-blue"
          to="/schema-management/$datasetKey"
          params={{ datasetKey: schema.key }}
        >
          {schema.name}
        </Link>
        <Tag type="teal" className="ml-2">
          Member
        </Tag>
        <Tag type="cool-gray" className="ml-1">
          {schema.current_version_number
            ? `v${schema.current_version_number}`
            : "Unpublished"}
        </Tag>
        <code className="text-xs text-giga-dark-gray">{schema.key}</code>
      </div>
      <span className="text-sm">{schema.column_count} own</span>
      <span className="text-sm">{coreColumnCount ?? 0} inherited</span>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {schema.pending_proposal_count > 0 ? (
          <Tag type="warm-gray">{schema.pending_proposal_count} pending</Tag>
        ) : (
          <span className="text-xs text-giga-dark-gray">No pending</span>
        )}
        {isPrivileged && (
          <>
            <Select
              id={`group-${schema.id}`}
              labelText=""
              hideLabel
              size="sm"
              value={schema.group_id ?? ""}
              onChange={event =>
                onMove(
                  schema.key,
                  event.target.value || null,
                  event.target.value ? schema.role : "member",
                )
              }
            >
              <SelectItem text="No group" value="" />
              {groups.map(candidate => (
                <SelectItem
                  key={candidate.id}
                  text={candidate.name}
                  value={candidate.id}
                />
              ))}
            </Select>
            <Select
              id={`role-${schema.id}`}
              labelText=""
              hideLabel
              size="sm"
              value={schema.role}
              onChange={event =>
                onMove(
                  schema.key,
                  schema.group_id,
                  event.target.value as SchemaRole,
                )
              }
            >
              <SelectItem text="Member" value="member" />
              <SelectItem text="Core" value="core" />
            </Select>
          </>
        )}
      </div>
    </div>
  );
}

function SchemaGroupDetail({ groupKey }: { groupKey: string }) {
  const [search, setSearch] = useState("");
  const [addSchemaOpen, setAddSchemaOpen] = useState(false);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isPrivileged } = useRoles();
  const {
    data: { data: group },
  } = useSuspenseQuery(schemaGroupDetailQueryOptions(groupKey));
  const {
    data: { data: groups },
  } = useSuspenseQuery(listDatasetGroupsQueryOptions);
  const {
    data: { data: datasets },
  } = useSuspenseQuery(listSchemaDatasetsQueryOptions);
  const { mutate: moveSchema, isPending: isMovingSchema } = useMutation({
    mutationFn: api.schemaRegistry.moveDataset,
    onSuccess: async () => {
      setPlacementError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["schema-registry", "groups"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["schema-registry", "datasets"],
        }),
      ]);
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      setPlacementError(
        error.response?.data?.detail ??
          "The schema placement could not be changed.",
      );
    },
  });
  const handleMove = (
    datasetKey: string,
    groupId: string | null,
    role?: SchemaRole,
  ) => moveSchema({ key: datasetKey, group_id: groupId, role });
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
                  kind="tertiary"
                  onClick={() => setAddExistingOpen(true)}
                >
                  Add existing schemas
                </Button>
                <Button onClick={() => setAddSchemaOpen(true)}>
                  Add new schema
                </Button>
                <LifecycleActions
                  resourceType="group"
                  resourceKey={group.key}
                  archived={group.archived_at != null}
                  onChanged={() => {
                    void navigate({ to: "/schema-management" });
                  }}
                />
              </div>
            )}
          </div>

          {placementError && (
            <InlineNotification
              className="mb-4"
              kind="error"
              title="Could not update schema placement"
              subtitle={placementError}
              onCloseButtonClick={() => setPlacementError(null)}
            />
          )}

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
                    {group.member_schemas.length} member{" "}
                    {group.member_schemas.length === 1 ? "schema" : "schemas"}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    as={Link}
                    kind="tertiary"
                    to="/schema-management/$datasetKey"
                    params={{ datasetKey: group.core_schema.key }}
                  >
                    View core columns
                  </Button>
                  {isPrivileged && (
                    <>
                      <Select
                        id={`group-${group.core_schema.id}`}
                        labelText=""
                        hideLabel
                        size="sm"
                        value={group.core_schema.group_id ?? ""}
                        disabled={isMovingSchema}
                        onChange={event =>
                          handleMove(
                            group.core_schema!.key,
                            event.target.value || null,
                            event.target.value ? "core" : "member",
                          )
                        }
                      >
                        <SelectItem text="No group" value="" />
                        {groups.map(candidate => (
                          <SelectItem
                            key={candidate.id}
                            text={candidate.name}
                            value={candidate.id}
                          />
                        ))}
                      </Select>
                      <Select
                        id={`role-${group.core_schema.id}`}
                        labelText=""
                        hideLabel
                        size="sm"
                        value="core"
                        disabled={isMovingSchema}
                        onChange={event =>
                          handleMove(
                            group.core_schema!.key,
                            group.id,
                            event.target.value as SchemaRole,
                          )
                        }
                      >
                        <SelectItem text="Member" value="member" />
                        <SelectItem text="Core" value="core" />
                      </Select>
                    </>
                  )}
                </div>
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
                  groups={groups}
                  isPrivileged={isPrivileged}
                  onMove={handleMove}
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
          <AddDatasetsToGroupModal
            group={group}
            groups={groups}
            datasets={datasets}
            open={addExistingOpen}
            onClose={() => setAddExistingOpen(false)}
          />
        </div>
      </div>
    </Section>
  );
}

export default SchemaGroupDetail;
