import { useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Breadcrumb } from "antd";

export default function UploadBreadcrumbs() {
  const { pathname } = useLocation();
  const { uploadGroup, uploadType } = useParams();

  const getBreadcrumbItems = useCallback(() => {
    const breadcrumbItems: { label: string; path?: string }[] = [
      { label: "Home", path: "/" },
      { label: "Upload", path: "/upload" },
    ];

    if (uploadGroup && uploadType) {
      breadcrumbItems.push(
        ...[
          {
            label: uploadGroup.split("-").join(" "),
            path: "/upload",
          },
          {
            label:
              uploadType.split("-").length > 2
                ? `${uploadType.split("-").slice(0, 2).join(" ")}...`
                : uploadType.split("-").join(" "),
            path: `/upload/${uploadType}`,
          },
        ],
      );
    }

    if (pathname.includes("/metadata")) {
      breadcrumbItems.push({
        label: "Metadata",
        path: `/upload/${uploadGroup}/${uploadType}/metadata`,
      });
    }

    if (pathname.includes("/success")) {
      breadcrumbItems.push(
        ...[
          {
            label: "Metadata",
            path: `/upload/${uploadGroup}/${uploadType}/metadata`,
          },
          {
            label: "Success",
            path: `/upload/${uploadGroup}/${uploadType}/success`,
          },
        ],
      );
    }

    return breadcrumbItems;
  }, [uploadGroup, uploadType, pathname]);

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Breadcrumb
      separator=">"
      style={{ viewTransitionName: "upload-breadcrumbs" }}
    >
      {breadcrumbItems.map((item, index) => (
        <Breadcrumb.Item key={item.label} className="capitalize">
          {item.path && index + 1 < breadcrumbItems.length ? (
            <Link to={item.path} unstable_viewTransition>
              {item.label}
            </Link>
          ) : (
            item.label
          )}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
}
