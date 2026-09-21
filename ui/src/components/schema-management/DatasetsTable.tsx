import { useMemo } from "react";

import {
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
} from "@carbon/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { api } from "@/api";
import {
  listDatasetGroupsQueryOptions,
  listSchemaDatasetsQueryOptions,
} from "@/api/queryOptions.ts";

const columns: DataTableHeader[] = [
  { key: "key", header: "Dataset" },
  { key: "group", header: "Group" },
  { key: "actions", header: "" },
];

function DatasetsTable() {
  const queryClient = useQueryClient();

  const { data: datasetsQuery, isLoading } = useSuspenseQuery(
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

  const rows = datasets.map(dataset => ({
    id: dataset.id,
    key: dataset.key,
    group: (
      <Select
        id={`group-${dataset.id}`}
        labelText=""
        hideLabel
        size="sm"
        value={dataset.group_id ?? ""}
        onChange={e =>
          moveDataset({
            key: dataset.key,
            group_id: e.target.value || null,
          })
        }
      >
        <SelectItem text="No group" value="" />
        {groups.map(group => (
          <SelectItem key={group.id} text={group.name} value={group.id} />
        ))}
      </Select>
    ),
    actions: (
      <Link
        className="cds--link"
        to="/schema-management/$datasetKey"
        params={{ datasetKey: dataset.key }}
      >
        View columns
      </Link>
    ),
  }));

  return isLoading ? (
    <DataTableSkeleton headers={columns} />
  ) : (
    <DataTable headers={columns} rows={rows}>
      {({
        rows: tableRows,
        headers,
        getHeaderProps,
        getRowProps,
        getTableProps,
      }) => (
        <TableContainer title="Datasets">
          <TableToolbar>
            <TableToolbarContent className="flex items-center gap-2">
              <Link
                className="cds--btn cds--btn--tertiary"
                to="/schema-management/groups"
              >
                Manage groups
              </Link>
              <Link
                className="cds--btn cds--btn--secondary"
                to="/schema-management/proposals"
              >
                Review proposals
              </Link>
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
              {tableRows.map(row => (
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

export default DatasetsTable;
