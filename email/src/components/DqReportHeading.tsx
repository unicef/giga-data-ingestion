import { Heading, Img } from "@react-email/components";

import { blobAssetUrls } from "../constants/blob-assets";
import { cn } from "../lib/utils";

interface DqReportHeaderProps {
  hasCriticalError: boolean;
  title: string;
}

function DqReportHeading({ hasCriticalError, title }: DqReportHeaderProps) {
  return (
    <Heading className="flex align-middle p-0 text-2xl font-normal ">
      <Img
        className="w-10 h-10 mr-2 -mt-1"
        src={
          hasCriticalError
            ? blobAssetUrls.misuseRed()
            : blobAssetUrls.misuseYellow()
        }
      />
      <strong
        className={cn({
          "text-giga-red": hasCriticalError,
          "text-giga-yellow": !hasCriticalError,
        })}
      >
        {title}
      </strong>
    </Heading>
  );
}

export default DqReportHeading;
