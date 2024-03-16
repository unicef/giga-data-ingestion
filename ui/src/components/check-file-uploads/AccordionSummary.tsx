import {
  CheckmarkOutline,
  Download,
  MisuseOutline,
  Warning,
} from "@carbon/icons-react";
import { Link, Tag } from "@carbon/react";
import { useMutation } from "@tanstack/react-query";

import { api } from "@/api";

interface AccordionSummaryProps {
  hasCriticalError: boolean;
  rows: number;
  totalFailedAssertions: number;
  totalPassedAssertions: number;
  uploadId: string;
}
const AccordionSummary = ({
  rows,
  totalPassedAssertions,
  totalFailedAssertions,
  uploadId,
}: AccordionSummaryProps) => {
  const downloadDataQualityCheck = useMutation({
    mutationFn: api.uploads.download_data_quality_check,
  });
  return (
    <div className="flex h-12 items-center gap-4 border-b-2 border-gray-200">
      <div className="flex h-full items-center bg-carbon-datatable-grey px-6 font-semibold">
        Data Quality Review ({rows} rows)
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="green">
          <CheckmarkOutline className="align-middle" /> {totalPassedAssertions}
          {"      "}
          success rows
        </Tag>
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="red">
          <Warning className="align-middle" /> {totalFailedAssertions}
          {"      "}
          Failed Rows
        </Tag>
      </div>
      <div className="flex ">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="magenta">
          <MisuseOutline className="align-middle" />
          {"      "} Has Critical Errors
        </Tag>
      </div>
      <div className="flex-grow"></div>
      <Link
        className="cursor-pointer"
        onClick={async () => {
          const x = await downloadDataQualityCheck.mutateAsync(uploadId);

          if (x) {
            const url = window.URL.createObjectURL(new Blob([x.data]));
            const link = document.createElement("a");
            link.href = url;

            const contentDisposition = x.headers["content-disposition"];
            const filenameMatch = contentDisposition.match(
              /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
            );
            let filename = "file.csv"; // Default filename
            if (filenameMatch != null && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, "");
            }

            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
          }
        }}
      >
        <Download /> Download CSV with data quality checks
      </Link>
    </div>
  );
};

export default AccordionSummary;
