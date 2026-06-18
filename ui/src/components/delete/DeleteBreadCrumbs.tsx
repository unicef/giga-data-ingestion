import { useCallback } from "react";

import { Breadcrumb, BreadcrumbItem } from "@carbon/react";
import { Link, useMatchRoute, useParams } from "@tanstack/react-router";

export default function DeleteBreadCrumbs() {
  const { country }: { country: string } = useParams({ strict: false });
  const matchRoute = useMatchRoute();
  const isNewPage = !!matchRoute({ to: "/delete/new" });

  const getBreadcrumbItems = useCallback(() => {
    const items: {
      label: string;
      path?: string;
      params?: Record<string, string>;
      search?: Record<string, unknown>;
    }[] = [{ label: "Deletion Requests", path: "/delete" }];

    if (isNewPage) {
      items.push({ label: "New Request" });
      return items;
    }

    if (country) {
      items.push({ label: "New Request", path: "/delete/new" });
      items.push({
        label: "Confirm",
        path: "/delete/$country",
        params: { country },
      });
    }

    return items;
  }, [country, isNewPage]);

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Breadcrumb
      style={{ viewTransitionName: "delete-breadcrumbs" }}
      noTrailingSlash
    >
      {breadcrumbItems.map((item, index) => (
        <BreadcrumbItem key={item.label} className="capitalize">
          {item.path && index + 1 < breadcrumbItems.length ? (
            <Link
              to={item.path}
              params={item.params ?? {}}
              search={item.search ?? {}}
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold">{item.label}</span>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
