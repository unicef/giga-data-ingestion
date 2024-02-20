import { useState } from "react";

import { Link, Modal } from "@carbon/react";

import Datatable from "@/components/upload/Datatable";
import {
  duplicateCheckModalHeaders,
  duplicateChecksHeaders,
} from "@/constants/check-file-uploads";
import { DataQualityCheckResult } from "@/types/upload";

type DuplicateCheckRow = {
  id: string;
  value: string;
}[];

export default function DuplicateChecks({
  data: data,
}: {
  data: DataQualityCheckResult | undefined;
}) {
  const [
    isInvalidDuplicateChecksModalOpen,
    setIsInvalidDuplicateChecksModalOpen,
  ] = useState<boolean>(false);
  const [
    invalidDuplicateChecksValuesRows,
    setInvalidDuplicateChecksValuesRows,
  ] = useState<DuplicateCheckRow>([]);

  const [selectedDuplicateCheckRow, setSelectedDuplicateCheckRow] =
    useState<string>("");

  if (data === undefined) return <></>;

  const duplicateChecksRows = data.duplicate_rows_checks.map(check => {
    return {
      id: check.assertion,
      check: check.description,
      count: check.count_failed,
      actions: (
        <Link
          onClick={() => {
            setIsInvalidDuplicateChecksModalOpen(true);

            const rows = check.rows_failed.map(row => {
              return {
                id: row,
                value: row,
              };
            });

            setInvalidDuplicateChecksValuesRows(rows);
            setSelectedDuplicateCheckRow(check.description);
          }}
        >
          View Details
        </Link>
      ),
    };
  });

  return (
    <>
      <div className="py-4">
        Total suspected duplicate rows:{" "}
        <b>{duplicateChecksRows?.length} rows</b>
      </div>
      <Datatable
        headers={duplicateChecksHeaders ?? []}
        rows={duplicateChecksRows ?? []}
      />

      <Modal
        modalHeading="Invalid Values Check"
        open={isInvalidDuplicateChecksModalOpen}
        passiveModal
        onRequestClose={() => setIsInvalidDuplicateChecksModalOpen(false)}
      >
        There are <b>{invalidDuplicateChecksValuesRows.length}</b> invalid
        values in <b>{selectedDuplicateCheckRow}</b>:
        <Datatable
          headers={duplicateCheckModalHeaders ?? []}
          rows={invalidDuplicateChecksValuesRows ?? []}
        />
      </Modal>
    </>
  );
}
