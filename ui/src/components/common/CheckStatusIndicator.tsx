import { Badge } from "antd";

import { CheckStatus } from "@/types/upload.ts";

export default function CheckStatusIndicator({
  checkStatus,
}: {
  checkStatus: CheckStatus;
}) {
  return (
    <div className="flex gap-1">
      <Badge
        status={checkStatus.severity}
        text={checkStatus.message}
        className="whitespace-pre"
      />
    </div>
  );
}
