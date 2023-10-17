import { useMemo } from "react";

import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, MenuProps, Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { useApi } from "@/api";
import { GraphUser } from "@/types/user.ts";

export default function Users() {
  const api = useApi();
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
        render: (_, record) => record.mail ?? record.user_principal_name,
      },
      {
        key: "groups",
        title: "Groups",
        dataIndex: "member_of",
        render: (value: GraphUser["member_of"]) =>
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
        <h2 className="text-[23px]">Users</h2>
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
