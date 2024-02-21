import { ComponentProps } from "react";

import { DotMark } from "@carbon/icons-react";

import { cn } from "@/lib/utils";

interface StatusIndicatorProps extends ComponentProps<typeof DotMark> {
  type?: "success" | "warning" | "info" | "error";
}

export default function StatusIndicator({
  className,
  type,
  ...props
}: StatusIndicatorProps) {
  return (
    <DotMark
      className={cn("self-center", className, {
        "text-giga-green": type === "success",
        "text-giga-yellow": type === "warning",
        "text-giga-blue": type === "info",
        "text-giga-red": type === "error",
      })}
      {...props}
    />
  );
}
