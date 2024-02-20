import { z } from "zod";

export interface DataQualityReportEmailProps {
  name: string;
}

export const DataQualityReportEmailProps = z.object({
  name: z.string(),
});
