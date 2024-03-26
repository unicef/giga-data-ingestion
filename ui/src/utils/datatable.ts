import { DataTableRow } from "@carbon/react";

import { KeyValueObject } from "@/types/datatable";

export const transformSelectedRowsToKeyValArray = (
  /* eslint-disable @typescript-eslint/no-explicit-any */
  selectedRows: DataTableRow<any[]>[],
): KeyValueObject[] => {
  return selectedRows.map(row => {
    const transformed: KeyValueObject = {};
    row.cells.forEach(cell => {
      transformed[cell.info.header] = cell?.value?.toString() ?? null;
    });
    return transformed;
  });
};
