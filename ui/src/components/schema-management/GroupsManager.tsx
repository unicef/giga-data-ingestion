import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import {
  Button,
  DataTable,
  DataTableHeader,
  InlineNotification,
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
import { listDatasetGroupsQueryOptions } from "@/api/queryOptions.ts";
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
    </Stack>
  );
}

export default GroupsManager;
