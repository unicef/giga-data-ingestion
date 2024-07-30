import type { ComponentProps } from "react";

import type { DataTable } from "@carbon/react";

export type CarbonDataTableRow = ComponentProps<typeof DataTable>["rows"];
export type KeyValueObject = {
  [key: string]: string | null;
};
