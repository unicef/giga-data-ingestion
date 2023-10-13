import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { api } from "@/api";
import { GraphRole } from "@/types/role.ts";

const columns: ColumnsType<GraphRole> = [
  {
    key: "displayName",
    title: "Name",
    dataIndex: "display_name",
    sorter: (a, b, sortOrder) =>
      sortOrder === "descend"
        ? b.display_name.localeCompare(a.display_name)
        : a.display_name.localeCompare(b.display_name),
  },
  {
    key: "description",
    title: "Description",
    dataIndex: "description",
  },
];

export default function Roles() {
  const { isLoading, data: response } = useQuery(["roles"], api.roles.list);
  const data = response?.data ?? [];

  return (
    <>
      <h2 className="text-[23px]">Roles</h2>

      <Table
        rowKey={row => row.id}
        dataSource={data}
        columns={columns}
        loading={isLoading}
        pagination={{
          position: ["bottomRight"],
        }}
      />
    </>
  );
}
