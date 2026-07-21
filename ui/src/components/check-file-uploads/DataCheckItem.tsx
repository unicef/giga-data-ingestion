import { Check } from "@/types/upload";

import DataQualityChecks from "./ColumnChecks";

interface DataCheckItemProps {
  data: Check[];
  title?: string;
  uploadId: string;
  hasDownloadButton?: boolean;
}

const DataCheckItem = ({ data }: DataCheckItemProps) => (
  <DataQualityChecks data={data} />
);

export default DataCheckItem;
