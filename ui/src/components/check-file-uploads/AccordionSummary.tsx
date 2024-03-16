import { CheckmarkOutline, MisuseOutline, Warning } from "@carbon/icons-react";
import { Tag } from "@carbon/react";

interface AccordionSummaryProps {
  rows: number;
  totalSuccessRows: number;
  totalFailedAssertions: number;
  hasCriticalError: boolean;
}
const AccordionSummary = ({
  rows,
  totalSuccessRows,
  totalFailedAssertions,
}: AccordionSummaryProps) => {
  return (
    <div className="flex h-12 items-center gap-4 border-b-2 border-gray-200">
      <div className="bg-carbon-datatable-grey flex h-full items-center px-6 font-semibold">
        Data Quality Review ({rows} rows)
      </div>
      <div className="flex">
        <Tag className="flex w-auto gap-2 px-3 py-2" type="green">
          <CheckmarkOutline className="align-middle" /> {totalSuccessRows}
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
    </div>
  );
};

export default AccordionSummary;
