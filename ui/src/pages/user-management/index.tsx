import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useMemo,
  useState,
} from "react";

import { useMsal } from "@azure/msal-react";
import { CheckmarkOutline, MisuseOutline, Tools } from "@carbon/icons-react";
import {
  Button,
  DataTable,
  DataTableHeader,
  Heading,
  Section,
  Stack,
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
  ToastNotification,
} from "@carbon/react";
// @ts-expect-error missing types https://github.com/carbon-design-system/carbon/issues/14831
import PaginationNav from "@carbon/react/lib/components/PaginationNav/PaginationNav";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/api";
import AddUserModal from "@/components/user-management/AddUserModal";
import EditUserModal from "@/components/user-management/EditUserModal";
import EnableUserModal from "@/components/user-management/EnableUserModal";
import RevokeUserModal from "@/components/user-management/RevokeUserModal";
import countries from "@/constants/countries";
import { GraphUser } from "@/types/user.ts";

type ToastProps = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  kind: string;
  caption: string;
  title: string;
};

interface TableGraphUser extends GraphUser {
  email_tag: ReactElement | null;
  countries: string;
  roles: string;
  actions: ReactElement | null;
}

export default function Users() {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEnableModalOpen, setIsEnableModalOpen] = useState<boolean>(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState<boolean>(false);
  const [showEditUserSuccessNotification, setShowEditUserSuccessNotification] =
    useState(false);
  const [showEditUserErrorNotification, setShowEditUserErrorNotification] =
    useState(false);

  const [, setCurrentPage] = useState(0);

  const ROWS_PER_PAGE = 10;

  const [selectedUser, setSelectedUser] = useState<GraphUser>({
    id: "",
    account_enabled: false,
    display_name: "",
    given_name: "",
    surname: "",
    mail: "",
    member_of: [],
    user_principal_name: "",
    external_user_state: null,
  });

  const api = useApi();
  const msal = useMsal();

  const { data: response } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
    refetchInterval: 3000, //set to 5 on prod
  });

  const { isFetching: groupsIsFetching } = useQuery({
    queryKey: ["groups"],
    queryFn: api.groups.list,
  });

  const handleEdit = (user: GraphUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const columns = useMemo<DataTableHeader[]>(
    () => [
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
        key: "groups",
        header: "Roles",
      },
      {
        key: "actions",
        header: "Actions",
      },
    ],
    [],
  );

  const usersData = response?.data ?? [];
  const filteredUsersData = useMemo(
    () =>
      usersData.map(originalUser => {
        const user = { ...originalUser } as TableGraphUser;

        user.email_tag = (
          <>
            {user.mail ?? user.user_principal_name}
            {user.external_user_state === "PendingAcceptance" && (
              <Tag className="uppercase" type="warm-gray">
                pending
              </Tag>
            )}
            {!user.account_enabled && user.external_user_state === "Accepted" && (
              <Tag className="uppercase" type="gray">
                Disabled
              </Tag>
            )}
          </>
        );

        user.countries = [
          ...new Set(
            originalUser.member_of
              .filter(group =>
                countries.some(country =>
                  group.display_name.startsWith(country["name"] + "-"),
                ),
              )
              .map(val => val.display_name.split("-")[0]),
          ),
        ].join(", ");

        user.roles = originalUser.member_of
          .filter(
            group =>
              !countries.some(country =>
                group.display_name.startsWith(country["name"] + "-"),
              ),
          )
          .map(val => val.display_name)
          .join(", ");

        user.actions = (
          <div className="flex gap-2">
            <Button
              kind="tertiary"
              renderIcon={Tools}
              size="sm"
              onClick={() => handleEdit(originalUser)}
            >
              Edit
            </Button>

            {originalUser.account_enabled ? (
              <Button
                kind="tertiary"
                disabled={
                  groupsIsFetching ||
                  originalUser.mail === msal.accounts[0].username
                }
                renderIcon={MisuseOutline}
                size="sm"
                onClick={() => {
                  setSelectedUser(originalUser);
                  setIsRevokeModalOpen(true);
                }}
              >
                Revoke
              </Button>
            ) : (
              <Button
                kind="tertiary"
                disabled={
                  groupsIsFetching ||
                  originalUser.mail === msal.accounts[0].username
                }
                renderIcon={CheckmarkOutline}
                size="sm"
                onClick={() => {
                  setSelectedUser(originalUser);
                  setIsEnableModalOpen(true);
                }}
              >
                Enable
              </Button>
            )}
          </div>
        );

        return user;
      }),
    [groupsIsFetching, msal.accounts, usersData],
  );

  function createToastNotification({
    show,
    setShow,
    kind,
    caption,
    title,
  }: ToastProps) {
    return (
      show && (
        <ToastNotification
          aria-label={`${title} notification`}
          kind={kind}
          caption={caption}
          onClose={() => setShow(false)}
          onCloseButtonClick={() => setShow(false)}
          statusIconDescription={kind}
          timeout={5000}
          title={title}
          className="absolute right-0 top-0 z-50 mx-6 my-16"
        />
      )
    );
  }

  return (
    <Section className="container py-6">
      <Stack gap={6}>
        <Section>
          <Heading>Giga User Management</Heading>
        </Section>
        <Section>
          <DataTable headers={columns} rows={filteredUsersData}>
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
                    <AddUserModal
                      isAddModalOpen={isAddModalOpen}
                      setIsAddModalOpen={setIsAddModalOpen}
                    />
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map(header => (
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
                <PaginationNav
                  itemsShown={5}
                  totalItems={Math.ceil(
                    filteredUsersData.length / ROWS_PER_PAGE,
                  )}
                  onChange={(index: number) => setCurrentPage(index)}
                />
              </TableContainer>
            )}
          </DataTable>

          {isEditModalOpen && (
            <EditUserModal
              initialValues={selectedUser}
              isEditModalOpen={isEditModalOpen}
              setIsEditModalOpen={setIsEditModalOpen}
              setShowEditUserSuccessNotification={
                setShowEditUserSuccessNotification
              }
              setShowEditUserErrorNotification={
                setShowEditUserErrorNotification
              }
            />
          )}
          {createToastNotification({
            show: showEditUserSuccessNotification,
            setShow: setShowEditUserSuccessNotification,
            kind: "success",
            caption:
              "User successfully modified. Please wait a moment or refresh the page for updates",
            title: "Modify user success",
          })}
          {createToastNotification({
            show: showEditUserErrorNotification,
            setShow: setShowEditUserErrorNotification,
            kind: "error",
            caption: "Operation failed. Please try again",
            title: "Modify user error",
          })}

            <RevokeUserModal
              initialValues={selectedUser}
              isRevokeModalOpen={isRevokeModalOpen}
              setIsRevokeModalOpen={setIsRevokeModalOpen}
            />

            <EnableUserModal
              initialValues={selectedUser}
              isEnableUserModalOpen={isEnableModalOpen}
              setIsEnableUserModalOpen={setIsEnableModalOpen}
            />
        </Section>
      </Stack>
    </Section>
  );
}
