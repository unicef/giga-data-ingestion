import { AccordionItem } from "@carbon/react";

import { Check, DqFailedRowsFirstFiveRows } from "@/types/upload";
import { sumAsertions } from "@/utils/data_quality";

import DataQualityChecks from "./ColumnChecks";
import SummaryBanner from "./SummaryBanner";

interface DataCheckItemProps {
  data: Check[];
  previewData: DqFailedRowsFirstFiveRows;
  title: string;
  uploadId: string;
}
const DataCheckItem = ({
  data,
  previewData,
  title,
  uploadId,
}: DataCheckItemProps) => {
  const { passed, failed } = sumAsertions([data]);

  return (
    <AccordionItem title={title}>
      <SummaryBanner
        totalAssertions={data.length}
        totalFailedAssertions={failed}
        totalPassedAssertions={passed}
        uploadId={uploadId}
      />
      <DataQualityChecks data={data} previewData={previewData} />
    </AccordionItem>
  );
};

export default DataCheckItem;
