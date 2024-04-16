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
    data: usersQuery,
    isLoading,
    refetch: refetchUsers,
    isRefetching,
  } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });
  const usersData = useMemo(() => usersQuery?.data ?? [], [usersQuery]);

  const filteredUsersData = useMemo(() => {
    return usersData
      .slice(
        (currentPage - 1) * pageSize,
        (currentPage - 1) * pageSize + pageSize,
      )
      .map(originalUser => {
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

        user.countries = "";
        user.roles = "";

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
                disabled={originalUser.id === accounts[0].idTokenClaims?.sub}
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
                disabled={originalUser.id === accounts[0].idTokenClaims?.sub}
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
  }, [usersData, currentPage, pageSize, accounts]);

  return isLoading ? (
    <DataTableSkeleton headers={columns} />
  ) : (
    <DataTable headers={columns} rows={filteredUsersData}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent className="flex items-center">
              <Button
                kind="ghost"
                renderIcon={Restart}
                hasIconOnly
                iconDescription="Reload"
                onClick={async () => await refetchUsers()}
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
