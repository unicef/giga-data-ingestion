import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  Heading,
  InlineNotification,
  Modal,
  Section,
  Select,
  SelectItem,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Tag,
} from "@carbon/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";

import { api } from "@/api";
import { listDatasetGroupsQueryOptions } from "@/api/queryOptions.ts";
import ChecksPanel from "@/components/schema-management/ChecksPanel.tsx";
import LifecycleActions from "@/components/schema-management/LifecycleActions.tsx";
import ProposalsTable from "@/components/schema-management/ProposalsTable.tsx";
import ProposeChangeModal from "@/components/schema-management/ProposeChangeModal.tsx";
import SchemaNavigator from "@/components/schema-management/SchemaNavigator.tsx";
import {
  countConfiguredChecks,
  formatColumnSource,
  formatDomainOrRange,
  sortColumnsForDisplay,
} from "@/components/schema-management/columnDisplay.ts";
import useRoles from "@/hooks/useRoles.ts";
import {
  DatasetImportResponse,
  RegistryColumn,
  ResolvedRegistryColumn,
  SchemaRole,
} from "@/types/schemaRegistry.ts";

const versionHeaders: DataTableHeader[] = [
  { key: "version", header: "Version" },
  { key: "timestamp", header: "Applied at" },
  { key: "operation", header: "Operation" },
  { key: "approved_by_email", header: "Approved by" },
];

interface DatasetDetailProps {
  datasetKey: string;
}

function ColumnsTable({
  datasetKey,
  columns,
  schemaRole,
  toolbar,
}: {
  datasetKey: string;
  columns: Array<RegistryColumn | ResolvedRegistryColumn>;
  schemaRole?: SchemaRole;
  toolbar?: ReactNode;
}) {
  const navigate = useNavigate();
  const openColumn = (columnName: string) => {
    void navigate({
      to: "/schema-management/$datasetKey/columns/$columnName",
      params: { datasetKey, columnName },
    });
  };

  if (columns.length === 0) {
    return (
      <div>
        {toolbar}
        <p className="border border-carbon-datatable-grey bg-white p-4 text-giga-dark-gray">
          No columns in this schema yet.
        </p>
      </div>
    );
  }

  const columnGridClass =
    "grid grid-cols-[minmax(12rem,1.6fr)_5.5rem_5rem_minmax(7.5rem,1fr)_minmax(8rem,1.1fr)_4.5rem] items-center gap-x-3 px-4";

  return (
    <div>
      {toolbar}
      <div className="overflow-x-auto border border-carbon-datatable-grey bg-white">
        <div
          className={`${columnGridClass} border-b border-carbon-datatable-grey py-2 text-xs font-semibold uppercase tracking-wide text-giga-dark-gray`}
        >
          <span>Column</span>
          <span>Type</span>
          <span>Origin</span>
          <span>Source</span>
          <span>Domain / Range</span>
          <span>Checks</span>
        </div>
        {sortColumnsForDisplay(columns).map(column => {
          const resolvedColumn =
            "origin" in column ? (column as ResolvedRegistryColumn) : null;
          const isOwned =
            resolvedColumn == null
              ? schemaRole !== "core"
              : resolvedColumn.origin === "member" &&
                resolvedColumn.owner_schema_key === datasetKey;
          const isCore =
            resolvedColumn?.origin === "core" ||
            (resolvedColumn == null && schemaRole === "core") ||
            (resolvedColumn != null && !isOwned);
          const sourceLabel = formatColumnSource(column);
          const domainRange = formatDomainOrRange(column);
          const checkCount = countConfiguredChecks(column);

          return (
            <div
              key={`${resolvedColumn?.owner_schema_key ?? "own"}-${
                column.name
              }`}
              role="link"
              tabIndex={0}
              className={`${columnGridClass} cursor-pointer border-b border-carbon-datatable-grey py-3 last:border-b-0 hover:bg-giga-light-blue`}
              onClick={() => openColumn(column.name)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openColumn(column.name);
                }
              }}
            >
              <div className="min-w-0">
                <div className="font-semibold">{column.name}</div>
                {column.description && (
                  <div className="truncate text-xs text-giga-dark-gray">
                    {column.description}
                  </div>
                )}
              </div>
              <div>
                <Tag type="purple">
                  {(column.data_type ?? "unknown").toUpperCase()}
                </Tag>
              </div>
              <div>
                {isCore ? (
                  <Tag type="blue">CORE</Tag>
                ) : (
                  <Tag type="teal">OWNED</Tag>
                )}
              </div>
              <div>
                {sourceLabel ? (
                  <Tag type="gray">{sourceLabel}</Tag>
                ) : (
                  <span className="text-sm text-giga-dark-gray">—</span>
                )}
              </div>
              <span className="min-w-0 truncate text-sm text-giga-dark-gray">
                {domainRange || "—"}
              </span>
              <span className="text-sm text-giga-dark-gray">
                {checkCount > 0
                  ? `${checkCount} check${checkCount === 1 ? "" : "s"}`
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatasetDetail({ datasetKey }: DatasetDetailProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isPrivileged } = useRoles();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [editColumnName, setEditColumnName] = useState<string | null>(null);
  const [snapshotVersion, setSnapshotVersion] = useState<number | null>(null);
  const [importResult, setImportResult] =
    useState<DatasetImportResponse | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [placementProposed, setPlacementProposed] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(false);
  const [draftGroupId, setDraftGroupId] = useState("");
  const [draftRole, setDraftRole] = useState<SchemaRole>("member");
  const [selectedTabId, setSelectedTabId] = useState("columns");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const isCoreSchema = dataset?.role === "core";
  const isArchived = dataset?.archived_at != null;
  const canResolve = dataset?.role === "member" && dataset.group_id !== null;

  useEffect(() => {
    setSelectedTabId(canResolve ? "resolved-columns" : "columns");
  }, [datasetKey, dataset?.role, canResolve]);

  const { data: columnsQuery, isLoading: isColumnsLoading } = useQuery({
    queryKey: ["schema-registry", "columns", datasetKey],
    queryFn: () => api.schemaRegistry.listColumns(datasetKey),
  });
  const columns = useMemo(() => columnsQuery?.data ?? [], [columnsQuery]);

  const {
    data: resolvedQuery,
    isLoading: isResolvedLoading,
    isError: isResolvedError,
    error: resolvedError,
  } = useQuery({
    queryKey: ["schema-registry", "resolved", datasetKey],
    queryFn: () => api.schemaRegistry.getResolvedSchema(datasetKey),
    enabled: canResolve,
  });
  const resolvedSchema = resolvedQuery?.data;
  const resolvedErrorMessage = (() => {
    if (resolvedError instanceof AxiosError) {
      const detail = (
        resolvedError.response?.data as { detail?: string | string[] }
      )?.detail;
      if (Array.isArray(detail)) return detail.join(" ");
      if (detail) return detail;
    }
    if (resolvedError instanceof Error) return resolvedError.message;
    return "Could not load resolved columns.";
  })();

  const { data: impactQuery } = useQuery({
    queryKey: ["schema-registry", "impact", datasetKey],
    queryFn: () => api.schemaRegistry.getSchemaImpact(datasetKey),
    enabled: isCoreSchema,
  });
  const impact = impactQuery?.data;

  const { data: versionsQuery, isLoading: isVersionsLoading } = useQuery({
    queryKey: ["schema-registry", "versions", datasetKey],
    queryFn: () => api.schemaRegistry.listVersions(datasetKey),
  });
  const versions = useMemo(() => versionsQuery?.data ?? [], [versionsQuery]);

  const { data: snapshotQuery } = useQuery({
    queryKey: ["schema-registry", "snapshot", datasetKey, snapshotVersion],
    queryFn: () =>
      api.schemaRegistry.getVersionSnapshot(
        datasetKey,
        snapshotVersion as number,
      ),
    enabled: snapshotVersion !== null,
  });
  const snapshotColumns = snapshotQuery?.data ?? [];

  const versionRows = versions.map(version => ({
    id: String(version.version),
    version: (
      <Button
        kind="ghost"
        size="sm"
        onClick={() => setSnapshotVersion(version.version)}
      >
        v{version.version}
      </Button>
    ),
    timestamp: new Date(version.timestamp).toLocaleString(),
    operation: version.operation ?? "",
    approved_by_email: version.approved_by_email ?? "",
  }));

  const handleProposeClose = async () => {
    setProposeOpen(false);
    setEditColumnName(null);
    await queryClient.invalidateQueries({
      queryKey: ["schema-registry", "columns", datasetKey],
    });
  };

  const { mutate: proposePlacement, isPending: isProposingPlacement } =
    useMutation({
      mutationFn: api.schemaRegistry.createProposal,
      onSuccess: async () => {
        setPlacementError(null);
        setEditingPlacement(false);
        setPlacementProposed(true);
        await queryClient.invalidateQueries({
          queryKey: ["schema-registry", "proposals"],
        });
      },
      onError: (error: { response?: { data?: { detail?: string } } }) => {
        const detail = error.response?.data?.detail;
        setPlacementError(
          Array.isArray(detail)
            ? detail.join(" ")
            : detail ?? "The placement proposal could not be created.",
        );
      },
    });

  const beginEditPlacement = () => {
    if (!dataset) return;
    setDraftGroupId(dataset.group_id ?? groups[0]?.id ?? "");
    setDraftRole(dataset.role);
    setPlacementError(null);
    setPlacementProposed(false);
    setEditingPlacement(true);
  };

  const cancelEditPlacement = () => {
    setEditingPlacement(false);
    setPlacementError(null);
  };

  const savePlacement = () => {
    if (!dataset) return;
    proposePlacement({
      datasetKey: dataset.key,
      body: {
        proposal_type: "placement",
        after_state: {
          group_id: draftGroupId || null,
          role: draftGroupId ? draftRole : "member",
        },
      },
    });
  };

  const { mutate: importColumns, isPending: isImporting } = useMutation({
    mutationFn: api.schemaRegistry.importDatasetColumns,
    onSuccess: async ({ data }) => {
      setImportResult(data);
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
          queryKey: ["schema-registry", "groups"],
        }),
      ]);
    },
  });

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    importColumns({ datasetKey, file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const editColumn = editColumnName
    ? columns.find(column => column.name === editColumnName)
    : undefined;

  return (
    <Section className="container py-6">
      <div className="grid min-w-0 grid-cols-1 gap-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SchemaNavigator
          activeGroupKey={group?.key}
          activeDatasetKey={datasetKey}
        />
        <div className="min-w-0">
          <div className="mb-5">
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
              <span className="text-giga-dark-gray">
                {dataset?.name ?? datasetKey}
              </span>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex gap-2">
                  {dataset && (
                    <Tag type={isCoreSchema ? "blue" : "teal"}>
                      {isCoreSchema ? "Core schema" : "Member schema"}
                    </Tag>
                  )}
                  {isArchived && <Tag type="red">Archived</Tag>}
                  {dataset && (
                    <Tag type="cool-gray">
                      {dataset.current_version_number
                        ? `Current v${dataset.current_version_number}`
                        : "No published version"}
                    </Tag>
                  )}
                  {resolvedSchema?.core_schema && (
                    <Tag type="cool-gray">
                      inherits {resolvedSchema.core_schema.key} v
                      {resolvedSchema.core_schema.version ?? "—"}
                    </Tag>
                  )}
                </div>
                <Heading>{dataset?.name ?? datasetKey}</Heading>
                <code className="text-xs text-giga-dark-gray">
                  {datasetKey}
                </code>
                {dataset?.description && (
                  <p className="mt-2 text-giga-dark-gray">
                    {dataset.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {isPrivileged && dataset && (
                  <LifecycleActions
                    resourceType="dataset"
                    resourceKey={dataset.key}
                    archived={isArchived}
                    onChanged={() => {
                      if (group) {
                        void navigate({
                          to: "/schema-management/groups/$groupKey",
                          params: { groupKey: group.key },
                        });
                      } else {
                        void navigate({ to: "/schema-management" });
                      }
                    }}
                  />
                )}
                {isPrivileged && !isArchived && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={event =>
                        handleImportFile(event.target.files?.[0])
                      }
                    />
                    <Button
                      kind="tertiary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      Import CSV
                    </Button>
                  </>
                )}
                <Button
                  kind="tertiary"
                  onClick={() => setSelectedTabId("proposals")}
                >
                  Proposals
                  {dataset && dataset.pending_proposal_count > 0
                    ? ` (${dataset.pending_proposal_count})`
                    : ""}
                </Button>
                <Button
                  onClick={() => {
                    setEditColumnName(null);
                    setProposeOpen(true);
                  }}
                  disabled={isColumnsLoading || isArchived}
                >
                  + Add Column
                </Button>
              </div>
            </div>
          </div>

          {dataset && (
            <div className="mb-5 border border-carbon-datatable-grey bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-giga-dark-gray">
                  Placement
                </h3>
                {isPrivileged && !isArchived && !editingPlacement && (
                  <Button kind="ghost" size="sm" onClick={beginEditPlacement}>
                    Edit
                  </Button>
                )}
              </div>
              {editingPlacement ? (
                <>
                  <div className="flex flex-wrap gap-4">
                    <Select
                      id={`dataset-group-${dataset.id}`}
                      labelText="Schema group"
                      size="md"
                      value={draftGroupId}
                      disabled={isProposingPlacement}
                      onChange={event => setDraftGroupId(event.target.value)}
                    >
                      {groups.map(candidate => (
                        <SelectItem
                          key={candidate.id}
                          text={candidate.name}
                          value={candidate.id}
                        />
                      ))}
                    </Select>
                    <Select
                      id={`dataset-role-${dataset.id}`}
                      labelText="Role"
                      size="md"
                      value={draftRole}
                      disabled={isProposingPlacement || !draftGroupId}
                      onChange={event =>
                        setDraftRole(event.target.value as SchemaRole)
                      }
                    >
                      <SelectItem text="Member" value="member" />
                      <SelectItem text="Core" value="core" />
                    </Select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={isProposingPlacement || !draftGroupId}
                      onClick={savePlacement}
                    >
                      {isProposingPlacement
                        ? "Creating proposal…"
                        : "Propose change"}
                    </Button>
                    <Button
                      kind="tertiary"
                      size="sm"
                      disabled={isProposingPlacement}
                      onClick={cancelEditPlacement}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="block text-giga-dark-gray">
                      Schema group
                    </span>
                    <span className="font-medium">{group?.name ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-giga-dark-gray">Role</span>
                    <span className="font-medium capitalize">
                      {dataset.role}
                    </span>
                  </div>
                </div>
              )}
              {placementProposed && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <InlineNotification
                    kind="success"
                    title="Placement proposal created"
                    onCloseButtonClick={() => setPlacementProposed(false)}
                  />
                  <Button
                    kind="tertiary"
                    size="sm"
                    onClick={() => setSelectedTabId("proposals")}
                  >
                    View proposals
                  </Button>
                </div>
              )}
              {placementError && (
                <InlineNotification
                  className="mt-3"
                  kind="error"
                  title="Could not create placement proposal"
                  subtitle={placementError}
                  onCloseButtonClick={() => setPlacementError(null)}
                />
              )}
            </div>
          )}

          {dataset && (
            <div className="mb-5 grid grid-cols-1 border border-carbon-datatable-grey bg-white md:grid-cols-4">
              <div className="border-b border-carbon-datatable-grey p-4 md:border-b-0 md:border-r">
                <span className="text-sm text-giga-dark-gray">Columns</span>
                <b className="mt-1 block text-xl">
                  {resolvedSchema?.columns.length ?? columns.length}
                </b>
              </div>
              <div className="border-b border-carbon-datatable-grey p-4 md:border-b-0 md:border-r">
                <span className="text-sm text-giga-dark-gray">From core</span>
                <b className="mt-1 block text-xl">
                  {resolvedSchema
                    ? resolvedSchema.columns.filter(
                        column => column.origin === "core",
                      ).length
                    : "—"}
                </b>
              </div>
              <div className="border-b border-carbon-datatable-grey p-4 md:border-b-0 md:border-r">
                <span className="text-sm text-giga-dark-gray">Owned here</span>
                <b className="mt-1 block text-xl">{columns.length}</b>
              </div>
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-4 text-left hover:bg-giga-light-blue"
                onClick={() => setSelectedTabId("proposals")}
              >
                <span className="text-sm text-giga-dark-gray">Pending</span>
                <b className="mt-1 block text-xl text-giga-blue">
                  {dataset.pending_proposal_count}
                </b>
              </button>
            </div>
          )}

          {(() => {
            const detailTabs: {
              id: string;
              label: string;
              content: ReactNode;
            }[] = [];

            if (canResolve) {
              detailTabs.push({
                id: "resolved-columns",
                label: "Columns",
                content: isResolvedLoading ? (
                  <p className="text-giga-dark-gray">Loading columns…</p>
                ) : isResolvedError ? (
                  <div>
                    <InlineNotification
                      kind="error"
                      title="Could not load resolved columns"
                      subtitle={resolvedErrorMessage}
                      hideCloseButton
                    />
                    <div className="mt-4">
                      <ColumnsTable
                        datasetKey={datasetKey}
                        columns={columns}
                        schemaRole={dataset?.role}
                      />
                    </div>
                  </div>
                ) : (
                  <ColumnsTable
                    datasetKey={datasetKey}
                    columns={resolvedSchema?.columns ?? columns}
                    schemaRole={dataset?.role}
                  />
                ),
              });
              detailTabs.push({
                id: "own-columns",
                label: "Own columns",
                content: (
                  <ColumnsTable
                    datasetKey={datasetKey}
                    columns={columns}
                    schemaRole={dataset?.role}
                  />
                ),
              });
            } else {
              detailTabs.push({
                id: "columns",
                label: "Columns",
                content: (
                  <ColumnsTable
                    datasetKey={datasetKey}
                    columns={columns}
                    schemaRole={dataset?.role}
                  />
                ),
              });
            }

            detailTabs.push({
              id: "dq-checks",
              label: "Data quality checks",
              content: (
                <ChecksPanel
                  datasetKey={datasetKey}
                  columns={resolvedSchema?.columns ?? columns}
                  onEditColumn={
                    isArchived
                      ? undefined
                      : columnName => {
                          if (
                            columns.some(column => column.name === columnName)
                          ) {
                            setEditColumnName(columnName);
                          }
                        }
                  }
                />
              ),
            });

            if (isCoreSchema) {
              detailTabs.push({
                id: "impact",
                label: "Impact",
                content: (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Member schema</TableHeader>
                          <TableHeader>Current resolution</TableHeader>
                          <TableHeader>Resolved columns</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {impact?.affected_members.map(member => (
                          <TableRow key={member.key}>
                            <TableCell>{member.name}</TableCell>
                            <TableCell>
                              Core v{member.current_core_version ?? "—"} +{" "}
                              {member.key} v{member.member_version ?? "—"}
                            </TableCell>
                            <TableCell>
                              {member.resolved_column_count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ),
              });
            }

            detailTabs.push({
              id: "versions",
              label: "Version history",
              content: (
                <DataTable headers={versionHeaders} rows={versionRows}>
                  {({
                    rows,
                    headers,
                    getHeaderProps,
                    getRowProps,
                    getTableProps,
                  }) => (
                    <TableContainer>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map(header => (
                              // @ts-expect-error onclick bad type https://github.com/carbon-design-system/carbon/issues/14831
                              <TableHeader {...getHeaderProps({ header })}>
                                {header.header}
                              </TableHeader>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map(row => (
                            <TableRow {...getRowProps({ row })}>
                              {row.cells.map(cell => (
                                <TableCell key={cell.id}>
                                  {cell.value}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DataTable>
              ),
            });

            detailTabs.push({
              id: "proposals",
              label:
                dataset && dataset.pending_proposal_count > 0
                  ? `Proposals (${dataset.pending_proposal_count})`
                  : "Proposals",
              content: (
                <Suspense
                  fallback={
                    <p className="text-giga-dark-gray">Loading proposals…</p>
                  }
                >
                  <ProposalsTable datasetKey={datasetKey} />
                </Suspense>
              ),
            });

            const selectedTabIndex = Math.max(
              detailTabs.findIndex(tab => tab.id === selectedTabId),
              0,
            );

            return (
              <div>
                <Tabs
                  selectedIndex={selectedTabIndex}
                  onChange={({ selectedIndex }) =>
                    setSelectedTabId(
                      detailTabs[selectedIndex]?.id ?? detailTabs[0].id,
                    )
                  }
                >
                  <TabList aria-label="Dataset detail tabs">
                    {detailTabs.map(tab => (
                      <Tab key={tab.id}>{tab.label}</Tab>
                    ))}
                  </TabList>
                </Tabs>
                <div className="mt-4">
                  {detailTabs[selectedTabIndex]?.content}
                </div>
              </div>
            );
          })()}

          <ProposeChangeModal
            datasetKey={datasetKey}
            columns={columns}
            open={proposeOpen || editColumnName !== null}
            onClose={() => void handleProposeClose()}
            initialProposalType={editColumnName ? "edit" : "add"}
            initialColumnName={editColumnName ?? undefined}
            initialColumn={editColumn}
            lockToInitialType
          />
          <Modal
            aria-label="import result modal"
            modalHeading="Import results"
            open={importResult !== null}
            passiveModal
            onRequestClose={() => setImportResult(null)}
          >
            {importResult && (
              <>
                <p>
                  Created {importResult.created}, updated {importResult.updated}
                  , skipped {importResult.skipped}.
                </p>
                {importResult.errors.length > 0 && (
                  <InlineNotification
                    kind="error"
                    title={`${importResult.errors.length} row(s) failed`}
                    subtitle={importResult.errors
                      .map(error => `Row ${error.row}: ${error.detail}`)
                      .join("; ")}
                    hideCloseButton
                  />
                )}
              </>
            )}
          </Modal>

          <Modal
            aria-label="version snapshot modal"
            modalHeading={
              snapshotVersion !== null
                ? `Columns as of v${snapshotVersion}`
                : ""
            }
            open={snapshotVersion !== null}
            passiveModal
            onRequestClose={() => setSnapshotVersion(null)}
          >
            <ul>
              {snapshotColumns.map(column => (
                <li key={column.name}>
                  <b>{column.name}</b> — {column.data_type}
                </li>
              ))}
            </ul>
          </Modal>

          {!isVersionsLoading && versions.length === 0 && (
            <p className="text-giga-dark-gray">
              No version history yet for this dataset.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

export default DatasetDetail;
