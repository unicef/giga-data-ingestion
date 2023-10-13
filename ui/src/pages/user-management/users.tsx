import { useMemo } from "react";

import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, MenuProps, Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { api } from "@/api";
import { GraphUser } from "@/types/user.ts";

export default function Users() {
  const { isLoading: areUsersLoading, data: usersResponse } = useQuery(
    ["users"],
    api.users.list,
  );
  const { isLoading: areRolesLoading, data: rolesResponse } = useQuery(
    ["roles"],
    api.roles.list,
  );

  const usersData = usersResponse?.data ?? [];
  const rolesData = rolesResponse?.data ?? [];

  function handleChangeRoles() {}

  function handleRevokeAccess() {}

  const actionMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "edit",
        label: "Change roles",
        onClick: handleChangeRoles,
      },
      {
        key: "revoke",
        label: "Revoke access",
        danger: true,
        onClick: handleRevokeAccess,
      },
    ],
    [],
  );

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
      },
      {
        key: "principalName",
        title: "Principal Name",
        dataIndex: "user_principal_name",
      },
      {
        key: "roles",
        title: "Roles",
        dataIndex: "app_role_assignments",
        render: (value: GraphUser["app_role_assignments"]) =>
          value
            .map(
              val =>
                rolesData.find(role => role.id === val.app_role_id)
                  ?.display_name ?? "",
            )
            .filter(Boolean)
            .join(", "),
      },
      {
        key: "actions",
        title: "Actions",
        dataIndex: "id",
        align: "right",
        render: () => (
          <Dropdown trigger={["click"]} menu={{ items: actionMenuItems }}>
            <DownOutlined className="text-primary" />
          </Dropdown>
        ),
      },
    ],
    [actionMenuItems, rolesData],
  );

  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-[23px]">User Management</h2>
        <Button type="primary" className="bg-primary">
          Add User
        </Button>
      </div>

      <Table
        rowKey={row => row.id}
        dataSource={usersData}
        columns={columns}
        loading={areUsersLoading || areRolesLoading}
        pagination={{
          position: ["bottomRight"],
        }}
      />
    </>
  );
}
