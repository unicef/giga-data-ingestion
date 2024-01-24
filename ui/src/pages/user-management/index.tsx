import { useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";

import {
  CheckCircleOutlined,
  CloseSquareOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import { Button, Row, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";

import { useApi } from "@/api";
import AddUserModal from "@/components/user-management/AddUserModal";
import EditUserModal from "@/components/user-management/EditUserModal";
import EnableUserModal from "@/components/user-management/EnableUserModal";
import RevokeUserModal from "@/components/user-management/RevokeUserModal";
import countries from "@/constants/countries";
import { GraphUser } from "@/types/user.ts";

export default function Users() {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEnableModalOpen, setIsEnableModalOpen] = useState<boolean>(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<GraphUser>({
    id: "",
    account_enabled: false,
    display_name: "",
    mail: "",
    member_of: [],
    user_principal_name: "",
    external_user_state: null,
  });

  const api = useApi();
  const msal = useMsal();

  const { isLoading, data: response } = useQuery({
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

  const usersData = response?.data ?? [];
  const filteredUsersData = usersData;

  const columns = useMemo<ColumnsType<GraphUser>>(
    () => [
      {
        key: "surname",
        title: "Surname",
        dataIndex: "surname",
        width: "12%",
      },
      {
        key: "firstName",
        title: "First Name",
        dataIndex: "given_name",
        width: "12%",
      },
      {
        key: "email",
        title: "Email",
        dataIndex: "mail",
        render: (value: GraphUser["mail"], record) => (
          <>
            {value ?? record.user_principal_name}
            {record.external_user_state === "PendingAcceptance" && (
              <Tag className="mx-2 uppercase" color="warning">
                pending
              </Tag>
            )}
            {!record.account_enabled &&
              record.external_user_state === "Accepted" && (
                <Tag className="mx-2 uppercase" color="error">
                  Disabled
                </Tag>
              )}
          </>
        ),
      },
      {
        key: "countries",
        title: "Countries",
        dataIndex: "member_of",
        render: (userGroups: GraphUser["member_of"]) =>
          [
            ...new Set(
              userGroups
                .filter(group =>
                  countries.some(country =>
                    group.display_name.startsWith(country["name"] + "-"),
                  ),
                )
                .map(val => val.display_name.split("-")[0]),
            ),
          ].join(", "),
      },
      {
        key: "groups",
        title: "Roles",
        dataIndex: "member_of",
        render: (userGroups: GraphUser["member_of"]) =>
          userGroups
            .filter(
              group =>
                !countries.some(country =>
                  group.display_name.startsWith(country["name"] + "-"),
                ),
            )
            .map(val => val.display_name)
            .join(", "),
      },
      {
        key: "actions",
        title: "Actions",
        dataIndex: "id",
        render: (_, record) => (
          <div className="flex gap-2">
            <Button
              className="!rounded-none"
              disabled={groupsIsFetching}
              ghost
              icon={<ToolOutlined />}
              size="small"
              type="primary"
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>

            {record.account_enabled ? (
              <Button
                className="!rounded-none"
                disabled={
                  groupsIsFetching || record.mail === msal.accounts[0].username
                }
                ghost
                icon={<CloseSquareOutlined />}
                size="small"
                type="primary"
                onClick={() => {
                  setSelectedUser(record);
                  setIsRevokeModalOpen(true);
                }}
              >
                Revoke
              </Button>
            ) : (
              <Button
                className="!rounded-none"
                disabled={
                  groupsIsFetching || record.mail === msal.accounts[0].username
                }
                ghost
                icon={<CheckCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => {
                  setSelectedUser(record);
                  setIsEnableModalOpen(true);
                }}
              >
                Enable
              </Button>
            )}
          </div>
        ),
      },
    ],
    [groupsIsFetching],
  );

  return (
    <div className="container py-6">
      <Row className="flex flex-col items-start justify-between gap-4">
        <h2 className="text-[23px]">Giga User Management</h2>

        <div className="ml-auto">
          <AddUserModal
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
          />
        </div>
      </Row>
      <Row>
        <Table
          rowKey={row => row.id}
          dataSource={filteredUsersData}
          columns={columns}
          loading={isLoading}
          pagination={{
            position: ["bottomRight"],
          }}
        />
        {isEditModalOpen && (
          <EditUserModal
            initialValues={selectedUser}
            isEditModalOpen={isEditModalOpen}
            setIsEditModalOpen={setIsEditModalOpen}
          />
        )}
        {isRevokeModalOpen && (
          <RevokeUserModal
            initialValues={selectedUser}
            isRevokeModalOpen={isRevokeModalOpen}
            setIsRevokeModalOpen={setIsRevokeModalOpen}
          />
        )}
        {isEnableModalOpen && (
          <EnableUserModal
            initialValues={selectedUser}
            isEnableUserModalOpen={isEnableModalOpen}
            setIsEnableUserModalOpen={setIsEnableModalOpen}
          />
        )}
        <Toaster
          containerStyle={{
            right: 40,
            bottom: 40,
          }}
          position="bottom-right"
          toastOptions={{ duration: 3000 }}
          reverseOrder={true}
        />
      </Row>
    </div>
  );
}
