import { useMemo } from "react";

import { Download } from "@carbon/icons-react";
import { Button, InlineLoading } from "@carbon/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { api } from "@/api";
import { UploadResponse, initialUploadResponse } from "@/types/upload";
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
    <div className="flex items-center">
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
