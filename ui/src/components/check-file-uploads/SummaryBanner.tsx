import {
  CheckmarkOutline,
  Download,
  MisuseOutline,
  Warning,
} from "@carbon/icons-react";
import { Button, InlineLoading, Tag } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";

import { api } from "@/api";
import { saveFile } from "@/utils/download";

interface AccordionSummaryProps {
  totalAssertions: number;
  criticalErrors?: number;
  totalFailedAssertions: number;
  totalPassedAssertions: number;
  uploadId: string;
  hasDownloadButton?: boolean;
}
const SummaryBanner = ({
  totalAssertions,
  criticalErrors = 0,
  totalPassedAssertions,
  totalFailedAssertions,
  uploadId,
  hasDownloadButton = true,
}: AccordionSummaryProps) => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: api.uploads.download_data_quality_check,
  });

  async function handleDownloadFullChecks() {
    const blob = await mutateAsync(uploadId);

    if (blob) {
      saveFile(blob);
    }
  }

  return (
    <div className="flex h-12 items-center gap-4 border-gray-200 border-b-2">
      <div className="flex h-full items-center bg-carbon-datatable-grey px-6 font-semibold">
        Data Quality Review ({totalAssertions} assertions)
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="green">
          <CheckmarkOutline className="align-middle" /> {totalPassedAssertions}
          {"      "}
          Successful assertions
        </Tag>
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="red">
          <Warning className="align-middle" /> {totalFailedAssertions}
          {"      "}
          Assertions with warnings
        </Tag>
      </div>
      {criticalErrors > 0 && (
        <div className="flex ">
          <Tag className="flex w-auto gap-2 px-3 py-2" type="magenta">
            <MisuseOutline className="align-middle" />
            {criticalErrors > 1
              ? `${criticalErrors} Critical Errors`
              : `${criticalErrors} Critical Error`}
          </Tag>
        </div>
      )}
      <div className="flex-grow" />
      {hasDownloadButton && (
        <Button
          kind="ghost"
          className="flex cursor-pointer items-center"
          onClick={handleDownloadFullChecks}
          renderIcon={isPending ? InlineLoading : Download}
          disabled={isPending}
        >
          Download CSV with data quality checks
        </Button>
      )}
    </div>
  );
};

export default SummaryBanner;
