import { useMemo, useState } from "react";

import { matchesSearch } from "@/utils/dq-summary";
import { UploadMetadataRow } from "@/utils/upload-metadata";

import { SummarySearch, SummaryTable } from "./SummaryTable";

interface MetadataTableProps {
  rows: UploadMetadataRow[];
}

const MetadataTable = ({ rows }: MetadataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter(
        row =>
          matchesSearch(row.label, searchTerm) ||
          matchesSearch(row.value, searchTerm),
      ),
    [rows, searchTerm],
  );

  return (
    <>
      <SummarySearch onChange={setSearchTerm} />
      <SummaryTable
        columns={[
          { key: "label", header: "Metadata" },
          { key: "value", header: "Description" },
        ]}
        groups={
          filteredRows.length === 0
            ? []
            : [
                {
                  key: "metadata",
                  title: "Upload metadata",
                  rows: filteredRows.map(row => ({
                    key: row.key,
                    cells: { label: row.label, value: row.value },
                  })),
                },
              ]
        }
        emptyMessage="No metadata was provided for this upload."
      />
    </>
  );
};

export default MetadataTable;
