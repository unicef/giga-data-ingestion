import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { Breadcrumb, Skeleton } from "antd";

import { useApi } from "@/api";
import { SentinelGroup } from "@/types/group.ts";

export default function GroupBreadcrumbs() {
  const api = useApi();
  const { groupId = "" } = useParams();
  const { isLoading, data: response } = useQuery(
    ["groups", groupId],
    () => api.groups.get(groupId),
    { enabled: !!groupId },
  );
  const group = response?.data ?? SentinelGroup;

  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs: { label: string; path?: string }[] = [
      { label: "Groups", path: "/user-management/groups" },
    ];

    if (groupId) {
      breadcrumbs.push({
        label: group.display_name,
        path: `/user-management/groups/${groupId}`,
      });
    }

    return breadcrumbs;
  }, [groupId, group]);

  const breadcrumbs = getBreadcrumbs();

  return (
    <Breadcrumb
      separator=">"
      style={{ viewTransitionName: "groups-breadcrumbs" }}
      className="text-[23px]"
    >
      {breadcrumbs.map((item, index) => (
        <Breadcrumb.Item key={item.path}>
          {item.path && index + 1 < breadcrumbs.length ? (
            <Link to={item.path} unstable_viewTransition>
              {item.label}
            </Link>
          ) : isLoading && groupId ? (
            <Skeleton.Button active className="w-12" size="small" />
          ) : (
            item.label
          )}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
}
