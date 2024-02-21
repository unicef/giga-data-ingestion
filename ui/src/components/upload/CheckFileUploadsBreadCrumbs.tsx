import { useCallback } from "react";

import { Breadcrumb, BreadcrumbItem } from "@carbon/react";
import { Link, useParams } from "@tanstack/react-router";

export default function CheckFileUploadsBreadCrumbs() {
  const { uploadId }: { uploadId: string } = useParams({
    strict: false,
  });

  const getBreadcrumbItems = useCallback(() => {
    const breadcrumbItems: {
      label: string;
      path?: string;
      params?: Record<string, string>;
    }[] = [
      { label: "Home", path: "/" },
      { label: "Check File Uploads", path: "/check-file-uploads" },
    ];

    if (uploadId) {
      breadcrumbItems.push(
        ...[
          {
            label: uploadId,
            path: "/check-file-uploads",
          },
        ],
      );
    }

    return breadcrumbItems;
  }, [uploadId]);

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Breadcrumb
      style={{ viewTransitionName: "upload-breadcrumbs" }}
      noTrailingSlash
    >
      {breadcrumbItems.map((item, index) => (
        <BreadcrumbItem key={item.label} className="capitalize">
          {item.path && index + 1 < breadcrumbItems.length ? (
            <Link to={item.path} params={item.params ?? {}}>
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
