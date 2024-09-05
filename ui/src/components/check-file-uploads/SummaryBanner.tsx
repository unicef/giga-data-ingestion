import { useMemo } from "react";

import {
  CheckmarkOutline,
  Download,
  MisuseOutline,
  Warning,
} from "@carbon/icons-react";
import { Button, InlineLoading, Tag } from "@carbon/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { api } from "@/api";
import { UploadResponse, initialUploadResponse } from "@/types/upload";
import { saveFile } from "@/utils/download";
import { commaNumber } from "@/utils/number.ts";

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
    mutationFn: api.uploads.download_data_quality_check_results,
  });

  const { data: uploadQuery } = useSuspenseQuery({
    queryKey: ["upload", uploadId],
    queryFn: () => api.uploads.get_upload(uploadId),
  });

  const uploadData = useMemo<UploadResponse>(
    () => uploadQuery?.data ?? initialUploadResponse,
    [uploadQuery],
  );

  const { mutateAsync: downloadDataQualityCheck } = useMutation({
    mutationFn: api.uploads.download_data_quality_check,
  });

  async function handleDownloadCheckPreview() {
    const blob = await downloadDataQualityCheck({
      dataset: uploadData.dataset,
      source: uploadData.source,
    });
    if (blob) {
      saveFile(blob);
    }
  }

  async function handleDownloadFullChecks() {
    const blob = await mutateAsync(uploadId);

    if (blob) {
      saveFile(blob);
    }
  }

  return (
    <div className="flex h-12 items-center gap-4 border-b-2 border-gray-200">
      <div className="flex h-full items-center bg-carbon-datatable-grey px-6 font-semibold">
        Data Quality Review ({totalAssertions} assertions)
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="green">
          <CheckmarkOutline className="align-middle" />{" "}
          {commaNumber(totalPassedAssertions)} Successful assertion
          {totalPassedAssertions > 1 && "s"}
        </Tag>
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="red">
          <Warning className="align-middle" />{" "}
          {commaNumber(totalFailedAssertions)} Assertion
          {totalFailedAssertions > 1 && "s"} with warnings
        </Tag>
      </div>
      {criticalErrors > 0 && (
        <div className="flex ">
          <Tag className="flex w-auto gap-2 px-3 py-2" type="magenta">
            <MisuseOutline className="align-middle" />{" "}
            {commaNumber(criticalErrors)} Critical Error
            {criticalErrors > 1 && "s"}
          </Tag>
        </div>
      )}
      <div className="flex-grow"></div>
      {hasDownloadButton && (
        <Button
          kind="ghost"
          className="flex cursor-pointer items-center"
          onClick={handleDownloadCheckPreview}
          renderIcon={Download}
        >
          Data Quality Check Descriptions
        </Button>
      )}

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
