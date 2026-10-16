import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  Heading,
  InlineNotification,
  Modal,
  Section,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
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
import { Link } from "@tanstack/react-router";

import { api } from "@/api";
import { listDatasetGroupsQueryOptions } from "@/api/queryOptions.ts";
import ChecksPanel from "@/components/schema-management/ChecksPanel.tsx";
import ProposeChangeModal from "@/components/schema-management/ProposeChangeModal.tsx";
import SchemaNavigator from "@/components/schema-management/SchemaNavigator.tsx";
import useRoles from "@/hooks/useRoles.ts";
import {
  DatasetImportResponse,
  RegistryColumn,
  ResolvedRegistryColumn,
} from "@/types/schemaRegistry.ts";

const columnHeaders: DataTableHeader[] = [
  { key: "name", header: "Name" },
  { key: "data_type", header: "Type" },
  { key: "flags", header: "Flags" },
  { key: "critical_for", header: "Critical for" },
  { key: "description", header: "Description" },
  { key: "origin", header: "Origin" },
];

const versionHeaders: DataTableHeader[] = [
  { key: "version", header: "Version" },
  { key: "timestamp", header: "Applied at" },
  { key: "operation", header: "Operation" },
  { key: "approved_by_email", header: "Approved by" },
];

interface DatasetDetailProps {
  datasetKey: string;
}

function getColumnRows(
  columns: Array<RegistryColumn | ResolvedRegistryColumn>,
) {
  return columns.map(column => {
    const resolvedColumn =
      "origin" in column ? (column as ResolvedRegistryColumn) : null;
    return {
      id: `${resolvedColumn?.owner_schema_key ?? "own"}-${column.name}`,
      name: column.name,
      data_type: column.data_type,
      flags: (
        <div className="flex gap-1">
          {!column.is_nullable && <Tag type="red">required</Tag>}
          {column.is_mandatory && <Tag type="magenta">mandatory</Tag>}
          {column.is_unique && <Tag type="purple">unique</Tag>}
          {column.primary_key && <Tag type="blue">pk</Tag>}
        </div>
      ),
      critical_for: column.critical_for ?? "",
      description: column.description ?? "",
      origin: resolvedColumn ? (
        <div className="flex items-center gap-1">
          <Tag type={resolvedColumn.origin === "core" ? "blue" : "teal"}>
            {resolvedColumn.origin === "core" ? "inherited" : "owned here"}
          </Tag>
          <span className="text-xs">{resolvedColumn.owner_schema_key}</span>
        </div>
      ) : (
        <Tag type="teal">owned here</Tag>
      ),
    };
  });
}

function ColumnsTable({
  columns,
  toolbar,
}: {
  columns: Array<RegistryColumn | ResolvedRegistryColumn>;
  toolbar?: ReactNode;
}) {
  return (
    <DataTable headers={columnHeaders} rows={getColumnRows(columns)}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer>
          {toolbar}
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map(header => (
                  // @ts-expect-error Carbon's header onclick type is incorrect
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
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
}

function DatasetDetail({ datasetKey }: DatasetDetailProps) {
  const queryClient = useQueryClient();
  const { isPrivileged } = useRoles();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [snapshotVersion, setSnapshotVersion] = useState<number | null>(null);
  const [importResult, setImportResult] =
    useState<DatasetImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: datasetQuery } = useQuery({
    queryKey: ["schema-registry", "dataset", datasetKey],
    queryFn: () => api.schemaRegistry.getDataset(datasetKey),
  });
  const dataset =
    datasetQuery?.data?.key === datasetKey ? datasetQuery.data : undefined;
  const {
    data: { data: groups },
  } = useSuspenseQuery(listDatasetGroupsQueryOptions);
  const group = groups.find(item => item.id === dataset?.group_id);
  const isCoreSchema = dataset?.role === "core";
  const canResolve = dataset?.role === "member" && dataset.group_id !== null;

  const { data: columnsQuery, isLoading: isColumnsLoading } = useQuery({
    queryKey: ["schema-registry", "columns", datasetKey],
    queryFn: () => api.schemaRegistry.listColumns(datasetKey),
  });
  const columns = useMemo(() => columnsQuery?.data ?? [], [columnsQuery]);

  const { data: resolvedQuery } = useQuery({
    queryKey: ["schema-registry", "resolved", datasetKey],
    queryFn: () => api.schemaRegistry.getResolvedSchema(datasetKey),
    enabled: canResolve,
  });
  const resolvedSchema = resolvedQuery?.data;

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
    await queryClient.invalidateQueries({
      queryKey: ["schema-registry", "columns", datasetKey],
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
                {isPrivileged && (
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
                      Import columns
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setProposeOpen(true)}
                  disabled={isColumnsLoading}
                >
                  Add or change column
                </Button>
              </div>
            </div>
          </div>

          {dataset && (
            <div className="mb-5 grid grid-cols-1 border border-carbon-datatable-grey bg-white md:grid-cols-3">
              <div className="border-b border-carbon-datatable-grey p-4 md:border-b-0 md:border-r">
                <span className="text-sm text-giga-dark-gray">
                  Effective columns
                </span>
                <b className="mt-1 block text-xl">
                  {resolvedSchema?.columns.length ?? columns.length}
                </b>
              </div>
              <div className="border-b border-carbon-datatable-grey p-4 md:border-b-0 md:border-r">
                <span className="text-sm text-giga-dark-gray">
                  Owned by this schema
                </span>
                <b className="mt-1 block text-xl">{columns.length}</b>
              </div>
              <div className="p-4">
                <span className="text-sm text-giga-dark-gray">
                  Inherited from core
                </span>
                <b className="mt-1 block text-xl">
                  {resolvedSchema
                    ? resolvedSchema.columns.filter(
                        column => column.origin === "core",
                      ).length
                    : "—"}
                </b>
              </div>
            </div>
          )}

          {resolvedSchema?.core_schema && (
            <InlineNotification
              className="mb-4"
              kind="info"
              title="Effective schema"
              subtitle={`Applications receive the combined ${resolvedSchema.core_schema.key} and ${datasetKey} columns. Inherited columns are read-only here.`}
              hideCloseButton
            />
          )}

          <Tabs key={`${datasetKey}-${dataset?.role ?? "loading"}`}>
            <TabList aria-label="Dataset detail tabs">
              {canResolve && <Tab>Columns</Tab>}
              <Tab>{isCoreSchema ? "Columns" : "Own columns"}</Tab>
              <Tab>Data quality checks</Tab>
              {isCoreSchema && <Tab>Impact</Tab>}
              <Tab>Version history</Tab>
            </TabList>
            <TabPanels>
              {canResolve && (
                <TabPanel>
                  {resolvedSchema && (
                    <ColumnsTable columns={resolvedSchema.columns} />
                  )}
                </TabPanel>
              )}
              <TabPanel>
                <ColumnsTable columns={columns} />
              </TabPanel>
              <TabPanel>
                <ChecksPanel columns={resolvedSchema?.columns ?? columns} />
              </TabPanel>
              {isCoreSchema && (
                <TabPanel>
                  <InlineNotification
                    className="mb-4"
                    kind="warning"
                    title={`Changes affect ${
                      impact?.affected_members.length ?? 0
                    } member schemas`}
                    subtitle="A core proposal is approved once. Reviewers see every affected member before approval."
                    hideCloseButton
                  />
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
                </TabPanel>
              )}
              <TabPanel>
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
              </TabPanel>
            </TabPanels>
          </Tabs>

          <ProposeChangeModal
            datasetKey={datasetKey}
            columns={columns}
            open={proposeOpen}
            onClose={() => void handleProposeClose()}
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
