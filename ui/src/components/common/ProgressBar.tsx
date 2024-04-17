import { ComponentProps } from "react";

import { ProgressBar as CarbonProgressBar } from "@carbon/react";

interface ProgressBarProps
  extends Partial<ComponentProps<typeof CarbonProgressBar>> {
  isLoading?: boolean;
}

function ProgressBar({ isLoading = false, ...props }: ProgressBarProps) {
  return isLoading ? (
    <CarbonProgressBar
      className="absolute left-0 top-0 z-10 w-full"
      type="default"
      label="Loading"
      hideLabel
      {...props}
    />
  ) : null;
}

export default ProgressBar;
