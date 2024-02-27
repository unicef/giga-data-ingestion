import { ReactElement, useMemo, useState } from "react";

import { useMsal } from "@azure/msal-react";
import {
  Add,
  CheckmarkOutline,
  MisuseOutline,
  Restart,
  Tools,
} from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableSkeleton,
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
  Tag,
} from "@carbon/react";
// @ts-expect-error missing types https://github.com/carbon-design-system/carbon/issues/14831
import Pagination from "@carbon/react/lib/components/Pagination/Pagination";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { useApi } from "@/api";
import { Select } from "@/components/forms/Select.tsx";
import { GraphUser } from "@/types/user.ts";

const columns: DataTableHeader[] = [
  {
    key: "surname",
    header: "Surname",
  },
  {
    key: "given_name",
    header: "First Name",
  },
  {
    key: "email_tag",
    header: "Email",
  },
  {
    key: "countries",
    header: "Countries",
  },
  {
    key: "roles",
    header: "Roles",
  },
  {
    key: "actions",
    header: "Actions",
  },
];

interface TableGraphUser extends GraphUser {
  email_tag: ReactElement | null;
  countries: string;
  roles: string;
  actions: ReactElement | null;
}

function UsersTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const api = useApi();
  const { accounts } = useMsal();

  const {
    data: response,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
    isRefetching: isUsersRefetching,
  } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });

  const {
    data: groupsQuery,
    isFetching: groupsIsFetching,
    isLoading: isGroupsLoading,
    refetch: refetchGroups,
    isRefetching: isGroupsRefetching,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });
  const groups = groupsQuery?.data ?? [];

  const [filterByRole, setFilterByRole] = useState<string>(groups[0]?.id ?? "");

  const isLoading = isUsersLoading || isGroupsLoading;
  const isRefetching = isUsersRefetching || isGroupsRefetching;

  // const handleEdit = (user: GraphUser) => {
  //   // setSelectedUser(user);
  //   // setIsEditModalOpen(true);
  // };

  const usersData = useMemo(() => response?.data ?? [], [response]);

  const filteredUsersData = useMemo(() => {
    return usersData.map(originalUser => {
      const user = { ...originalUser } as TableGraphUser;

      user.email_tag = (
        <>
          {user.mail ?? user.user_principal_name}
          {user.external_user_state === "PendingAcceptance" && (
            <Tag className="uppercase" type="warm-gray">
              pending
            </Tag>
          )}
          {!user.account_enabled &&
            user.external_user_state !== "PendingAcceptance" && (
              <Tag className="uppercase" type="gray">
                Disabled
              </Tag>
            )}
        </>
      );

      user.countries = [
        // ...new Set(
        //   originalUser.member_of
        //     .filter(group =>
        //       countries.some(country =>
        //         group.display_name.startsWith(country["name"] + "-"),
        //       ),
        //     )
        //     .map(val => val.display_name.split("-")[0]),
        // ),
      ].join(", ");

      user.roles = "";

      // user.roles = originalUser.member_of
      //   .filter(
      //     group =>
      //       !countries.some(country =>
      //         group.display_name.startsWith(country["name"] + "-"),
      //       ),
      //   )
      //   .map(val => val.display_name)
      //   .join(", ");

      user.actions = (
        <div className="flex gap-2">
          <Button
            kind="tertiary"
            renderIcon={Tools}
            size="sm"
            as={Link}
            to="./user/edit/$userId"
            params={{ userId: originalUser.id }}
          >
            Edit
          </Button>

          {originalUser.account_enabled ? (
            <Button
              kind="tertiary"
              disabled={
                groupsIsFetching ||
                originalUser.id === accounts[0].idTokenClaims?.sub
              }
              renderIcon={MisuseOutline}
              size="sm"
              as={Link}
              to="./user/revoke/$userId"
              params={{ userId: originalUser.id }}
            >
              Revoke
            </Button>
          ) : (
            <Button
              kind="tertiary"
              disabled={
                groupsIsFetching ||
                originalUser.id === accounts[0].idTokenClaims?.sub
              }
              renderIcon={CheckmarkOutline}
              size="sm"
              as={Link}
              to="./user/enable/$userId"
              params={{ userId: originalUser.id }}
            >
              Enable
            </Button>
          )}
        </div>
      );

      return user;
    });
  }, [groupsIsFetching, accounts, usersData]);

  if (isLoading) return <DataTableSkeleton headers={columns} />;

  return (
    <DataTable headers={columns} rows={filteredUsersData}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent className="flex items-center">
              <Select
                id="group"
                inline
                labelText="Filter by role"
                value={filterByRole}
                onChange={({ target: { value } }) => setFilterByRole(value)}
              >
                {groups.map(group => (
                  <SelectItem
                    key={group.id}
                    text={group.display_name}
                    value={group.id}
                  />
                ))}
              </Select>
              <Button
                kind="ghost"
                renderIcon={Restart}
                hasIconOnly
                iconDescription="Reload"
                onClick={async () => {
                  await refetchUsers();
                  await refetchGroups();
                }}
                disabled={isRefetching}
              />
              <Button renderIcon={Add} as={Link} to="./user/add">
                Add User
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
          <Pagination
            onChange={({
              pageSize,
              page,
            }: {
              pageSize: number;
              page: number;
            }) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            }}
            page={currentPage}
            pageSize={pageSize}
            pageSizes={[10, 25, 50]}
            totalItems={usersData.length}
          />
        </TableContainer>
      )}
    </DataTable>
  );
}

export default UsersTable;
