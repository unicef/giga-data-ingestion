import { SkeletonPlaceholder } from "@carbon/react";

export default function FullPageLoading() {
  return (
    <div className="h-full bg-cover text-white">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SkeletonPlaceholder />
        </div>
      </div>
    </div>
  );
}
