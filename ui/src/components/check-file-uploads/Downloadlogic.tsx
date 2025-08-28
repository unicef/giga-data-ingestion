import { useMutation } from "@tanstack/react-query";

import { api } from "@/api";
import { UploadResponse } from "@/types/upload";
import { saveFile } from "@/utils/download";

export function useDownloadHelpers(uploadData: UploadResponse) {
  const { mutateAsync: downloadFailedRows } = useMutation({
    mutationFn: api.uploads.download_failed_rows,
  });

  const { mutateAsync: downloadPassedRows } = useMutation({
    mutationFn: api.uploads.download_passed_rows,
  });

  const { mutateAsync: downloadDqSummary } = useMutation({
    mutationFn: api.uploads.download_dq_summary,
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
