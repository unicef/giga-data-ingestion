import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  Button,
  DataTable,
  DataTableHeader,
  InlineNotification,
  Select,
  SelectItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TextArea,
  TextInput,
} from "@carbon/react";
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
import { CreateDatasetGroupRequest } from "@/types/schemaRegistry.ts";

const columns: DataTableHeader[] = [
  { key: "key", header: "Key" },
  { key: "name", header: "Name" },
  { key: "description", header: "Description" },
];

function GroupsManager() {
  const queryClient = useQueryClient();
  const [showError, setShowError] = useState(false);

  const { data: groupsQuery } = useSuspenseQuery(listDatasetGroupsQueryOptions);
  const groups = useMemo(() => groupsQuery?.data ?? [], [groupsQuery]);
  const { data: datasetsQuery } = useSuspenseQuery(
    listSchemaDatasetsQueryOptions,
  );
  const datasets = useMemo(() => datasetsQuery?.data ?? [], [datasetsQuery]);

  const { register, handleSubmit, reset, formState } =
    useForm<CreateDatasetGroupRequest>({ mode: "onChange" });

  const { mutateAsync: createGroup, isPending } = useMutation({
    mutationFn: api.schemaRegistry.createGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["schema-registry", "groups"],
      });
    },
  });

  const { mutate: updatePlacement } = useMutation({
    mutationFn: api.schemaRegistry.moveDataset,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["schema-registry", "datasets"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["schema-registry", "groups"],
        }),
      ]);
    },
  });

  const onSubmit: SubmitHandler<CreateDatasetGroupRequest> = async data => {
    try {
      await createGroup(data);
      reset();
    } catch (err) {
      console.error(err);
      setShowError(true);
    }
  };

  return (
    <Stack gap={6}>
      <form
        aria-label="add dataset group form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stack gap={4}>
          <div className="flex gap-4">
            <TextInput
              id="group-key"
              labelText="Key"
              {...register("key", { required: true })}
            />
            <TextInput
              id="group-name"
              labelText="Name"
              {...register("name", { required: true })}
            />
          </div>
          <TextArea
            id="group-description"
            labelText="Description"
            {...register("description")}
          />
          {showError && (
            <InlineNotification
              kind="error"
              title="Could not create group"
              subtitle="A group with that key may already exist."
              onCloseButtonClick={() => setShowError(false)}
            />
          )}
          <Button type="submit" disabled={!formState.isValid || isPending}>
            Add group
          </Button>
        </Stack>
      </form>

      <DataTable headers={columns} rows={groups}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer title="Dataset groups">
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

      <TableContainer
        title="Schema placement"
        description="Assign each schema to one group and designate at most one core per group."
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Schema</TableHeader>
              <TableHeader>Group</TableHeader>
              <TableHeader>Role</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map(dataset => (
              <TableRow key={dataset.id}>
                <TableCell>
                  <b>{dataset.name}</b>
                  <div className="text-xs text-giga-dark-gray">
                    {dataset.key}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    id={`placement-group-${dataset.id}`}
                    labelText=""
                    hideLabel
                    size="sm"
                    value={dataset.group_id ?? ""}
                    onChange={event =>
                      updatePlacement({
                        key: dataset.key,
                        group_id: event.target.value || null,
                        role:
                          event.target.value === "" ? "member" : dataset.role,
                      })
                    }
                  >
                    <SelectItem text="Needs grouping" value="" />
                    {groups.map(group => (
                      <SelectItem
                        key={group.id}
                        text={group.name}
                        value={group.id}
                      />
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    id={`placement-role-${dataset.id}`}
                    labelText=""
                    hideLabel
                    size="sm"
                    value={dataset.role}
                    disabled={!dataset.group_id}
                    onChange={event =>
                      updatePlacement({
                        key: dataset.key,
                        group_id: dataset.group_id,
                        role: event.target.value as "core" | "member",
                      })
                    }
                  >
                    <SelectItem text="Member" value="member" />
                    <SelectItem text="Core" value="core" />
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default GroupsManager;
