import { useMemo } from "react";

import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, MenuProps, Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { api } from "@/api";
import { GraphUser } from "@/types/user.ts";

export default function Users() {
  const { isLoading, data: response } = useQuery(["users"], api.users.list);
  const data = response?.data ?? [];

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
        key: "key",
        title: "ID",
        dataIndex: "id",
      },
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
    <div className="container flex flex-col gap-4 py-6">
      <div className="flex justify-between">
        <h2 className="text-[23px]">User Management</h2>
        <Button type="primary" className="bg-primary">
          Add User
        </Button>
      </div>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        pagination={{
          position: ["bottomRight"],
        }}
      />
    </div>
  );
}
