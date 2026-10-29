import { useMemo, useState } from "react";

import { ArrowRight } from "@carbon/icons-react";

import { ValueMapSection, matchesSearch } from "@/utils/dq-summary";

import { SummarySearch, SummaryTable, SummaryTableGroup } from "./SummaryTable";

interface MappingsTableProps {
  sections: ValueMapSection[];
}

const MappingsTable = ({ sections }: MappingsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const groups = useMemo<SummaryTableGroup[]>(
    () =>
      sections.flatMap(section => {
        const rows = section.rows.filter(
          row =>
            matchesSearch(row.src, searchTerm) ||
            matchesSearch(row.dst, searchTerm) ||
            matchesSearch(section.title, searchTerm),
        );
        if (rows.length === 0) return [];

        return [
          {
            key: section.title,
            title: section.title,
            rows: rows.map((row, index) => ({
              key: `${row.src}-${index}`,
              cells: {
                src: row.src,
                arrow: <ArrowRight className="text-gray-500" />,
                dst: row.dst,
                count: row.count,
                pct: row.pct,
              },
            })),
          },
        ];
      }),
    [sections, searchTerm],
  );

  return (
    <>
      <p className="mb-4 text-sm text-gray-600">
        These mappings have been applied to all uploaded data, to standardise
        terminologies to Giga values. If there are any inconsistencies, please
        contact your Giga focal point.
      </p>
      <SummarySearch onChange={setSearchTerm} />
      <SummaryTable
        columns={[
          { key: "src", header: "Mappings" },
          { key: "arrow", header: "" },
          { key: "dst", header: "" },
          { key: "count", header: "#", align: "right" },
          { key: "pct", header: "%", align: "right" },
        ]}
        groups={groups}
        emptyMessage="No mappings were applied to this upload."
      />
    </>
  );
};

export default MappingsTable;
