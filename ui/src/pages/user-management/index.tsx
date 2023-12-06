import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";

import { useApi } from "@/api";
import AddUserModal from "@/components/user-management/AddUserModal";
import { GraphUser } from "@/types/user.ts";

export default function Users() {
  const api = useApi();
  const { isLoading, data: response } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
  });

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
      },
      {
        key: "groups",
        title: "Roles",
        dataIndex: "member_of",
        render: (value: GraphUser["member_of"]) =>
          value.map(val => val.display_name).join(", "),
      },
      {
        key: "actions",
        title: "Actions",
        dataIndex: "id",
        render: () => (
          <div className="flex gap-1">
            <Button ghost type="primary" size="small">
              Edit
            </Button>
            <Button ghost type="primary" size="small">
              Revoke
            </Button>
          </div>
        ),
      },
    ],
    [],
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
    </>
  );
}
