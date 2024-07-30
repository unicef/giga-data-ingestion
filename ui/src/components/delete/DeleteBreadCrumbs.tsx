import { useCallback } from "react";

import { Breadcrumb, BreadcrumbItem } from "@carbon/react";
import { Link, useParams } from "@tanstack/react-router";

export default function DeleteBreadCrumbs() {
  const { country }: { country: string } = useParams({ strict: false });

  const getBreadcrumbItems = useCallback(() => {
    const breadcrumbItems: {
      label: string;
      path?: string;
      params?: Record<string, string>;
      search?: Record<string, unknown>;
    }[] = [{ label: "Delete Rows", path: "/delete" }];

    if (country) {
      breadcrumbItems.push(
        ...[
          {
            label: "Confirm",
            path: "/delete/$country",
            params: { country },
          },
        ],
      );
    }

    return breadcrumbItems;
  }, [country]);

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Breadcrumb style={{ viewTransitionName: "delete-breadcrumbs" }} noTrailingSlash>
      {breadcrumbItems.map((item, index) => (
        <BreadcrumbItem key={item.label} className="capitalize">
          {item.path && index + 1 < breadcrumbItems.length ? (
            <Link to={item.path} params={item.params ?? {}} search={item.search ?? {}}>
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
