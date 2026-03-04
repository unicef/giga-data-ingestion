import { useMutation } from "@tanstack/react-query";

import { api } from "@/api";
import { DataQualityCheck, UploadResponse } from "@/types/upload";
import { saveFile, savePdfFromBase64 } from "@/utils/download";

export function useDownloadHelpers(
  uploadData: UploadResponse,
  dqResultData?: DataQualityCheck | null,
) {
  const { mutateAsync: downloadFailedRows } = useMutation({
    mutationFn: api.uploads.download_failed_rows,
  });

  const { mutateAsync: downloadPassedRows } = useMutation({
    mutationFn: api.uploads.download_passed_rows,
  });

  const { mutateAsync: downloadDqSummary } = useMutation({
    mutationFn: api.uploads.download_dq_summary,
  });

  const { mutateAsync: getDqReportPdf } = useMutation({
    mutationFn: api.email.getDqReportPdf,
  });

  const { mutateAsync: downloadRawFile } = useMutation({
    mutationFn: api.uploads.download_raw_file,
  });

  function getFilenameFromFullPath(): string {
    const pathParts = uploadData.dq_full_path?.split("/") || [];
    return pathParts[pathParts.length - 1];
  }

  async function handleDownloadFailedRows() {
    const blob = await downloadFailedRows({
      dataset: `school-${uploadData.dataset}`,
      country_code: uploadData.country,
      filename: getFilenameFromFullPath(),
    });

    if (blob) saveFile(blob);
  }

  async function handleDownloadPassedRows() {
    const blob = await downloadPassedRows({
      dataset: `school-${uploadData.dataset}`,
      country_code: uploadData.country,
      filename: getFilenameFromFullPath(),
    });

    if (blob) saveFile(blob);
  }

  async function handleDownloadDqSummary() {
    if (dqResultData?.dq_summary) {
      const res = await getDqReportPdf({
        email: uploadData.uploader_email,
        props: {
          dataset: uploadData.dataset,
          dataQualityCheck: dqResultData.dq_summary,
          uploadDate: uploadData.created,
          uploadId: uploadData.id,
          country: uploadData.country,
        },
      });
      if (res?.data?.pdf && res?.data?.filename) {
        savePdfFromBase64(res.data.pdf, res.data.filename);
      }
      return;
    }
    const blob = await downloadDqSummary({
      dataset: `school-${uploadData.dataset}`,
      country_code: uploadData.country,
      filename: getFilenameFromFullPath().replace(".csv", ".json"),
    });

    if (blob) saveFile(blob);
  }

  async function handleDownloadRawFile() {
    // Extract filename from upload_path (e.g., "raw/uploads/school-geolocation/MOZ/filename.csv" -> "filename.csv")
    const pathParts = uploadData.upload_path?.split("/") || [];
    const filename = pathParts[pathParts.length - 1];

    const blob = await downloadRawFile({
      dataset: uploadData.dataset,
      country_code: uploadData.country,
      filename: filename,
    });
    if (blob) saveFile(blob);
  }

  return {
    handleDownloadFailedRows,
    handleDownloadPassedRows,
    handleDownloadDqSummary,
    handleDownloadRawFile,
  };
}
