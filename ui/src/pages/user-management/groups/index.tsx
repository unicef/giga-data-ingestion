import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";

import { useApi } from "@/api";
import { GraphGroup } from "@/types/group.ts";

const columns: ColumnsType<GraphGroup> = [
  {
    key: "displayName",
    title: "Name",
    dataIndex: "display_name",
    render: (value, record) => (
      <Link to={`${record.id}`} unstable_viewTransition>
        {value}
      </Link>
    ),
  },
  {
    key: "description",
    title: "Description",
    dataIndex: "description",
  },
];

export default function Groups() {
  const api = useApi();
  const { isLoading, data: response } = useQuery(["groups"], api.groups.list);
  const data = response?.data ?? [];

  return (
    <>
      <h2 className="text-[23px]">Groups</h2>

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
