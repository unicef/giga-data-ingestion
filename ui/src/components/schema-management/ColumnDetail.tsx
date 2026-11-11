import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Button,
  Heading,
  InlineNotification,
  Section,
  Tag,
} from "@carbon/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { api } from "@/api";
import { listDatasetGroupsQueryOptions } from "@/api/queryOptions.ts";
import PromoteColumnModal from "@/components/schema-management/PromoteColumnModal.tsx";
import ProposeChangeModal from "@/components/schema-management/ProposeChangeModal.tsx";
import SchemaNavigator from "@/components/schema-management/SchemaNavigator.tsx";
import {
  formatColumnSource,
  formatDomainOrRange,
  parseDomainValues,
} from "@/components/schema-management/columnDisplay.ts";
import {
  RegistryColumn,
  ResolvedRegistryColumn,
} from "@/types/schemaRegistry.ts";

interface ColumnDetailProps {
  datasetKey: string;
  columnName: string;
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-carbon-datatable-grey py-3 last:border-b-0">
      <span className="block text-sm text-giga-dark-gray">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function booleanLabel(value: boolean | null | undefined) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

function ColumnDetail({ datasetKey, columnName }: ColumnDetailProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promotionCreated, setPromotionCreated] = useState(false);

  const { data: datasetQuery } = useQuery({
    queryKey: ["schema-registry", "dataset", datasetKey],
    queryFn: () => api.schemaRegistry.getDataset(datasetKey, true),
  });
  const dataset =
    datasetQuery?.data?.key === datasetKey ? datasetQuery.data : undefined;
  const {
    data: { data: groups },
  } = useSuspenseQuery(listDatasetGroupsQueryOptions);
  const group = groups.find(item => item.id === dataset?.group_id);
  const isArchived = dataset?.archived_at != null;
  const isMember = dataset?.role === "member";
  const canResolve = isMember && dataset.group_id !== null;

  const { data: columnsQuery } = useQuery({
    queryKey: ["schema-registry", "columns", datasetKey],
    queryFn: () => api.schemaRegistry.listColumns(datasetKey),
  });
  const ownedColumns = useMemo(() => columnsQuery?.data ?? [], [columnsQuery]);

  const { data: resolvedQuery } = useQuery({
    queryKey: ["schema-registry", "resolved", datasetKey],
    queryFn: () => api.schemaRegistry.getResolvedSchema(datasetKey),
    enabled: canResolve,
  });

  const resolvedColumn = resolvedQuery?.data?.columns.find(
    column => column.name === columnName,
  ) as ResolvedRegistryColumn | undefined;

  const { data: columnQuery, isLoading: isColumnLoading } = useQuery({
    queryKey: ["schema-registry", "column", datasetKey, columnName],
    queryFn: () => api.schemaRegistry.getColumn(datasetKey, columnName),
    enabled: !resolvedColumn,
    retry: false,
  });

  const column: RegistryColumn | ResolvedRegistryColumn | undefined =
    resolvedColumn ??
    ownedColumns.find(item => item.name === columnName) ??
    columnQuery?.data;

  const isOwnedHere =
    resolvedColumn != null
      ? resolvedColumn.origin === "member" &&
        resolvedColumn.owner_schema_key === datasetKey
      : ownedColumns.some(item => item.name === columnName);

  const isInherited =
    resolvedColumn?.origin === "core" ||
    (resolvedColumn != null && resolvedColumn.owner_schema_key !== datasetKey);

  const canPromote = isMember && isOwnedHere && !isArchived && !isInherited;
  // Inherited/imported core columns are read-only on member schemas.
  const canEdit = isOwnedHere && !isArchived && !isInherited;
  const canDelete = canEdit;

  const { data: historyQuery } = useQuery({
    queryKey: ["schema-registry", "column-history", datasetKey, columnName],
    queryFn: () => api.schemaRegistry.getColumnHistory(datasetKey, columnName),
  });
  const history = historyQuery?.data ?? [];

  const domainValues = column ? parseDomainValues(column.domain_values) : [];
  const domainOrRange = column ? formatDomainOrRange(column) : "";

  if (!isColumnLoading && !column) {
    return (
      <Section className="container py-6">
        <InlineNotification
          kind="error"
          title="Column not found"
          subtitle={`${columnName} is not part of ${datasetKey}.`}
          hideCloseButton
        />
        <Button
          className="mt-4"
          kind="tertiary"
          onClick={() =>
            void navigate({
              to: "/schema-management/$datasetKey",
              params: { datasetKey },
            })
          }
        >
          Back to schema
        </Button>
      </Section>
    );
  }

  return (
    <Section className="container py-6">
      <div className="grid min-w-0 grid-cols-1 gap-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SchemaNavigator
          activeGroupKey={group?.key}
          activeDatasetKey={datasetKey}
        />
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <Link className="cds--link" to="/schema-management">
              Schema groups
            </Link>
            {group && (
              <>
                <span>/</span>
                <Link
                  className="cds--link"
                  to="/schema-management/groups/$groupKey"
                  params={{ groupKey: group.key }}
                >
                  {group.name}
                </Link>
              </>
            )}
            <span>/</span>
            <Link
              className="cds--link"
              to="/schema-management/$datasetKey"
              params={{ datasetKey }}
            >
              {dataset?.name ?? datasetKey}
            </Link>
            <span>/</span>
            <span className="text-giga-dark-gray">{columnName}</span>
          </div>

          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {column && (
                  <Tag type="purple">{column.data_type.toUpperCase()}</Tag>
                )}
                {isInherited ? (
                  <Tag type="blue">CORE / inherited</Tag>
                ) : (
                  <Tag type="teal">OWNED</Tag>
                )}
                {column?.is_important && <Tag type="cyan">Important</Tag>}
                {isArchived && <Tag type="red">Schema archived</Tag>}
              </div>
              <Heading>{columnName}</Heading>
              {column?.description && (
                <p className="mt-2 text-giga-dark-gray">{column.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canPromote && (
                <Button onClick={() => setPromoteOpen(true)}>
                  Promote to core
                </Button>
              )}
              {canEdit && (
                <Button kind="tertiary" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  kind="danger--tertiary"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>

          {promotionCreated && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <InlineNotification
                kind="success"
                title="Promotion proposal created"
                onCloseButtonClick={() => setPromotionCreated(false)}
              />
              <Button
                kind="tertiary"
                size="sm"
                onClick={() =>
                  void navigate({ to: "/schema-management/proposals" })
                }
              >
                View proposals
              </Button>
            </div>
          )}

          {column && (
            <>
              <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="border border-carbon-datatable-grey bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-giga-dark-gray">
                    Schema metadata
                  </h3>
                  <MetaItem label="Data type">
                    <Tag type="purple">{column.data_type.toUpperCase()}</Tag>
                  </MetaItem>
                  <MetaItem label="Origin">
                    {isInherited ? (
                      <Tag type="blue">CORE</Tag>
                    ) : (
                      <Tag type="teal">OWNED</Tag>
                    )}
                  </MetaItem>
                  <MetaItem label="Nullable">
                    {booleanLabel(column.is_nullable)}
                  </MetaItem>
                  <MetaItem label="Primary key">
                    {booleanLabel(column.primary_key)}
                  </MetaItem>
                  <MetaItem label="Important">
                    {booleanLabel(column.is_important)}
                  </MetaItem>
                  <MetaItem label="Source">
                    {formatColumnSource(column) || "—"}
                  </MetaItem>
                  <MetaItem label="Units">{column.units ?? "—"}</MetaItem>
                  <MetaItem label="Partition order">
                    {column.partition_order ?? "—"}
                  </MetaItem>
                  <MetaItem label="License">{column.license ?? "—"}</MetaItem>
                  <MetaItem label="Description">
                    {column.description ?? "—"}
                  </MetaItem>
                  <MetaItem label="Hint">{column.hint ?? "—"}</MetaItem>
                </div>

                <div className="border border-carbon-datatable-grey bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-giga-dark-gray">
                    Data quality checks
                  </h3>
                  <MetaItem label="Mandatory">
                    {column.is_mandatory ? (
                      <Tag type="magenta">Enabled</Tag>
                    ) : (
                      <span className="text-giga-dark-gray">Disabled</span>
                    )}
                  </MetaItem>
                  <MetaItem label="Critical for">
                    {column.critical_for ?? "—"}
                  </MetaItem>
                  <MetaItem label="Unique">
                    {column.is_unique ? (
                      <Tag type="purple">Enabled</Tag>
                    ) : (
                      <span className="text-giga-dark-gray">Disabled</span>
                    )}
                  </MetaItem>
                  <MetaItem label="Domain values">
                    {domainValues.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {domainValues.map(value => (
                          <Tag key={value} type="teal">
                            {value}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </MetaItem>
                  <MetaItem label="Range">
                    {column.range_min !== null ||
                    column.range_max !== null ||
                    column.dynamic_max
                      ? domainOrRange || "—"
                      : "—"}
                  </MetaItem>
                  <MetaItem label="Dynamic max">
                    {column.dynamic_max ?? "—"}
                  </MetaItem>
                  <MetaItem label="Precision min">
                    {column.precision_min ?? "—"}
                  </MetaItem>
                </div>
              </div>

              <div className="border border-carbon-datatable-grey bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-giga-dark-gray">
                  Change history
                </h3>
                {history.length === 0 ? (
                  <p className="text-giga-dark-gray">No changes yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {history.map(entry => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-carbon-datatable-grey pb-3 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium capitalize">
                            {entry.proposal_type} · {entry.proposed_by_email}
                          </div>
                          <div className="text-sm text-giga-dark-gray">
                            {new Date(entry.created).toLocaleString()}
                          </div>
                        </div>
                        <Tag
                          type={
                            entry.status === "approved"
                              ? "green"
                              : entry.status === "pending"
                              ? "warm-gray"
                              : "red"
                          }
                        >
                          {entry.status}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <ProposeChangeModal
            datasetKey={datasetKey}
            columns={ownedColumns}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            initialProposalType="edit"
            initialColumnName={columnName}
            initialColumn={
              isOwnedHere
                ? ownedColumns.find(item => item.name === columnName)
                : undefined
            }
            lockToInitialType
          />
          <ProposeChangeModal
            datasetKey={datasetKey}
            columns={ownedColumns}
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            initialProposalType="delete"
            initialColumnName={columnName}
            initialColumn={
              isOwnedHere
                ? ownedColumns.find(item => item.name === columnName)
                : undefined
            }
            lockToInitialType
          />
          <PromoteColumnModal
            datasetKey={datasetKey}
            columnName={promoteOpen ? columnName : null}
            onClose={() => setPromoteOpen(false)}
            onCreated={() => {
              setPromoteOpen(false);
              setPromotionCreated(true);
            }}
          />
        </div>
      </div>
    </Section>
  );
}

export default ColumnDetail;
