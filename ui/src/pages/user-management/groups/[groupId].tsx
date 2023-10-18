import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { useApi } from "@/api";
import { SentinelGroup } from "@/types/group.ts";
import { GraphUser } from "@/types/user.ts";

const columns: ColumnsType<GraphUser> = [
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
];

export default function GroupMembers() {
  const api = useApi();
  const { groupId = "" } = useParams();

  const { isLoading: isGroupLoading, data: groupResponse } = useQuery(
    ["groups", groupId],
    () => api.groups.get(groupId),
  );
  const group = groupResponse?.data ?? SentinelGroup;

  const { isLoading, data: response } = useQuery(
    ["groups", groupId, "users"],
    () => api.groups.list_users_in_group(groupId),
  );
  const usersData = response?.data ?? [];

  return (
    <>
      {group.description}

      <Table
        rowKey={row => row.id}
        dataSource={usersData}
        columns={columns}
        loading={isGroupLoading || isLoading}
        pagination={{
          position: ["bottomRight"],
        }}
      />
    </>
  );
}
