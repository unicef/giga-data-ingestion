import { useMemo } from "react";

import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, MenuProps, Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { api } from "@/api";
import { GraphUserWithRoles } from "@/types/user.ts";

export default function Users() {
  const { isLoading, data: response } = useQuery(["users"], api.users.list);

  const usersData = response?.data ?? [];

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

  const columns = useMemo<ColumnsType<GraphUserWithRoles>>(
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
        render: (_, record) => record.mail ?? record.user_principal_name,
      },
      {
        key: "roles",
        title: "Roles",
        dataIndex: "app_role_assignments",
        render: (value: GraphUserWithRoles["app_role_assignments"]) =>
          value.map(val => val.display_name).join(", "),
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
    [actionMenuItems],
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
        loading={isLoading}
        pagination={{
          position: ["bottomRight"],
        }}
      />
    </>
  );
}
