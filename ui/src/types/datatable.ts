import { ComponentProps } from "react";

import { DataTable } from "@carbon/react";

export type CarbonDataTableRow = ComponentProps<typeof DataTable>["rows"];
export type KeyValueObject = {
  [key: string]: string | null;
};
