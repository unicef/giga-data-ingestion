import { useCallback } from "react";

import { Breadcrumb, BreadcrumbItem } from "@carbon/react";
import { Link, useParams, useRouterState } from "@tanstack/react-router";

import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/constants/pagination.ts";

export default function UploadBreadcrumbs() {
  const {
    location: { pathname },
  } = useRouterState();
  const {
    uploadGroup,
    uploadType,
  }: { uploadGroup: string; uploadType: string } = useParams({ strict: false });

  const getBreadcrumbItems = useCallback(() => {
    const breadcrumbItems: {
      label: string;
      path?: string;
      params?: Record<string, string>;
      search?: Record<string, unknown>;
    }[] = [{ label: "File uploads", path: "/upload" }];

    if (uploadGroup && uploadType) {
      breadcrumbItems.push(
        ...[
          {
            label: uploadGroup.split("-").join(" "),
            path: "/upload",
            search: { page: DEFAULT_PAGE_NUMBER, page_size: DEFAULT_PAGE_SIZE },
          },
          {
            label:
              uploadType.split("-").length > 2
                ? `${uploadType.split("-").slice(0, 2).join(" ")}...`
                : uploadType.split("-").join(" "),
            path: "/upload/$uploadGroup/$uploadType",
            params: { uploadGroup, uploadType },
          },
        ],
      );
    }

    if (pathname.includes("/metadata")) {
      breadcrumbItems.push({
        label: "Metadata",
        path: "/upload/$uploadGroup/$uploadType/metadata",
        params: { uploadGroup, uploadType },
      });
    }

    if (pathname.includes("/success")) {
      breadcrumbItems.push(
        ...[
          {
            label: "Metadata",
            path: "/upload/$uploadGroup/$uploadType/metadata",
            params: { uploadGroup, uploadType },
          },
          {
            label: "Success",
            path: `/upload/$uploadGroup/$uploadType/success`,
            params: { uploadGroup, uploadType },
          },
        ],
      );
    }

    return breadcrumbItems;
  }, [uploadGroup, uploadType, pathname]);

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Breadcrumb
      style={{ viewTransitionName: "upload-breadcrumbs" }}
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
            item.label
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
