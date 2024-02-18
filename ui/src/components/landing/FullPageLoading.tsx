import { SkeletonPlaceholder } from "@carbon/react";

export default function FullPageLoading() {
  return (
    <div className="h-full bg-cover text-white">
      <div className="flex h-full w-full flex-col items-center justify-center backdrop-brightness-50">
        <div className="flex flex-col items-center gap-4">
          <SkeletonPlaceholder />
        </div>
      </div>
    </div>
  );
}
