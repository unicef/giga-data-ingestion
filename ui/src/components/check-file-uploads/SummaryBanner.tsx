import {
  CheckmarkOutline,
  Download,
  MisuseOutline,
  Warning,
} from "@carbon/icons-react";
import { Button, InlineLoading, Tag } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";
import { saveAs } from "file-saver";

import { api } from "@/api";

interface AccordionSummaryProps {
  totalAssertions: number;
  hasCriticalError?: boolean;
  totalFailedAssertions: number;
  totalPassedAssertions: number;
  uploadId: string;
}
const SummaryBanner = ({
  totalAssertions,
  hasCriticalError = false,
  totalPassedAssertions,
  totalFailedAssertions,
  uploadId,
}: AccordionSummaryProps) => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: api.uploads.download_data_quality_check,
  });

  async function handleDownloadFullChecks() {
    const blob = await mutateAsync(uploadId);

    if (blob) {
      const contentDisposition = blob.headers["content-disposition"];
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      let filename = "file.csv"; // Default filename
      if (filenameMatch != null && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }

      const file = new File([blob.data], filename, {
        type: blob.data.type,
      });
      saveAs(file);
    }
  }

  return (
    <div className="flex h-12 items-center gap-4 border-b-2 border-gray-200">
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
          Assertions with errors
        </Tag>
      </div>
      {hasCriticalError && (
        <div className="flex ">
          <Tag className="flex w-auto gap-2 px-3 py-2" type="magenta">
            <MisuseOutline className="align-middle" />
            {"      "} Has Critical Errors
          </Tag>
        </div>
      )}
      <div className="flex-grow"></div>
      <Button
        kind="ghost"
        className="flex cursor-pointer items-center"
        onClick={handleDownloadFullChecks}
        renderIcon={isPending ? InlineLoading : Download}
        disabled={isPending}
      >
        Download CSV with data quality checks
      </Button>
    </div>
  );
};

export default SummaryBanner;
