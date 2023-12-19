import { useMemo, useState } from "react";

import { CloseSquareOutlined, ToolOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";

import { useApi } from "@/api";
import AddUserModal from "@/components/user-management/AddUserModal";
import EditUserModal from "@/components/user-management/EditUserModal";
import countries from "@/constants/countries";
import { GraphUser } from "@/types/user.ts";

export default function Users() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const { isLoading, data: response } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
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

  const columns = useMemo<ColumnsType<GraphUser>>(
    () => [
      {
        key: "name",
        title: "Name",
        dataIndex: "display_name",
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
          </>
        ),
      },
      {
        key: "countries",
        title: "Countries",
        dataIndex: "member_of",
        render: (userGroups: GraphUser["member_of"]) =>
          userGroups
            .filter(group =>
              countries.some(country => country["name"] === group.display_name),
            )
            .map(val => val.display_name)
            .join(", "),
      },
      {
        key: "groups",
        title: "Roles",
        dataIndex: "member_of",
        render: (userGroups: GraphUser["member_of"]) =>
          userGroups
            .filter(
              group =>
                !countries.some(
                  country => country["name"] === group.display_name,
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
              ghost
              disabled={groupsIsFetching}
              icon={<ToolOutlined />}
              onClick={() => handleEdit(record)}
              type="primary"
              size="small"
            >
              Edit
            </Button>
            <Button
              ghost
              disabled={groupsIsFetching}
              className="!rounded-none"
              icon={<CloseSquareOutlined />}
              type="primary"
              size="small"
            >
              Revoke
            </Button>
          </div>
        ),
      },
    ],
    [groupsIsFetching],
  );

  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4">
        <h2 className="text-[23px]">Giga User Management</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </p>
        <AddUserModal />
      </div>

      <Table
        rowKey={row => row.id}
        dataSource={usersData}
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
    </>
  );
}
