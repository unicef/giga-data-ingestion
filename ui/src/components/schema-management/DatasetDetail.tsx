import { useMemo, useState } from "react";

import {
  Button,
  DataTable,
  DataTableHeader,
  Heading,
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
  TableToolbar,
  TableToolbarContent,
  Tabs,
  Tag,
} from "@carbon/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api";
import ProposeChangeModal from "@/components/schema-management/ProposeChangeModal.tsx";

const columnHeaders: DataTableHeader[] = [
  { key: "name", header: "Name" },
  { key: "data_type", header: "Type" },
  { key: "flags", header: "Flags" },
  { key: "critical_for", header: "Critical for" },
  { key: "description", header: "Description" },
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

function DatasetDetail({ datasetKey }: DatasetDetailProps) {
  const queryClient = useQueryClient();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [snapshotVersion, setSnapshotVersion] = useState<number | null>(null);

  const { data: columnsQuery, isLoading: isColumnsLoading } = useQuery({
    queryKey: ["schema-registry", "columns", datasetKey],
    queryFn: () => api.schemaRegistry.listColumns(datasetKey),
  });
  const columns = useMemo(() => columnsQuery?.data ?? [], [columnsQuery]);

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

  const columnRows = columns.map(column => ({
    id: column.name,
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
  }));

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

  return (
    <Section className="container py-6">
      <Heading>{datasetKey}</Heading>

      <Tabs>
        <TabList aria-label="Dataset detail tabs">
          <Tab>Columns</Tab>
          <Tab>Version history</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DataTable headers={columnHeaders} rows={columnRows}>
              {({
                rows,
                headers,
                getHeaderProps,
                getRowProps,
                getTableProps,
              }) => (
                <TableContainer>
                  <TableToolbar>
                    <TableToolbarContent>
                      <Button
                        onClick={() => setProposeOpen(true)}
                        disabled={isColumnsLoading}
                      >
                        Propose change
                      </Button>
                    </TableToolbarContent>
                  </TableToolbar>
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
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </TabPanel>
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
                            <TableCell key={cell.id}>{cell.value}</TableCell>
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
        aria-label="version snapshot modal"
        modalHeading={
          snapshotVersion !== null ? `Columns as of v${snapshotVersion}` : ""
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
    </Section>
  );
}

export default DatasetDetail;
