import { ReactElement, useMemo } from "react";

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
  Pagination,
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";

import { api } from "@/api";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";
import { DatabaseUser } from "@/types/user.ts";

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

interface TableDatabaseUser extends DatabaseUser {
  email_tag: ReactElement | null;
  countries: string;
  roles: string;
  actions: ReactElement | null;
}

function UsersTable() {
  const {
    page: currentPage = DEFAULT_PAGE_NUMBER,
    page_size: pageSize = DEFAULT_PAGE_SIZE,
  } = useSearch({
    from: "/user-management",
  });
  const navigate = useNavigate({ from: "/user-management" });

  const { accounts } = useMsal();

  const handlePaginationChange = ({
    pageSize,
    page,
  }: {
    pageSize: number;
    page: number;
  }) => {
    void navigate({ to: ".", search: () => ({ page, page_size: pageSize }) });
  };

  const {
    data: usersQuery,
    isLoading,
    refetch: refetchUsers,
    isRefetching,
  } = useSuspenseQuery({
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
        const user = { ...originalUser } as TableDatabaseUser;

        user.email_tag = (
          <>
            {user.email}
            {!user.enabled && (
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
              search={{ page: currentPage, page_size: pageSize }}
            >
              Edit
            </Button>

            {originalUser.enabled ? (
              <Button
                kind="tertiary"
                disabled={originalUser.id === accounts[0].idTokenClaims?.sub}
                renderIcon={MisuseOutline}
                size="sm"
                as={Link}
                to="./user/revoke/$userId"
                params={{ userId: originalUser.id }}
                search={{ page: currentPage, page_size: pageSize }}
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
                search={{ page: currentPage, page_size: pageSize }}
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
              <Button
                renderIcon={Add}
                as={Link}
                to="./user/add"
                search={{
                  page: currentPage,
                  page_size: pageSize,
                }}
              >
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
            onChange={handlePaginationChange}
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
