import { SkeletonPlaceholder } from "@carbon/react";

export function PendingComponent() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SkeletonPlaceholder />
    </div>
  );
}
