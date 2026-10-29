import { useMemo, useState } from "react";

import { DqReportSection, matchesSearch } from "@/utils/dq-summary";
import { commaNumber } from "@/utils/number";

import { SummarySearch, SummaryTable, SummaryTableGroup } from "./SummaryTable";

interface DqSectionTableProps {
  title: string;
  sections: DqReportSection[];
}

const DqSectionTable = ({ title, sections }: DqSectionTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const groups = useMemo<SummaryTableGroup[]>(
    () =>
      sections.flatMap(section => {
        const rows = section.rows.filter(
          row =>
            matchesSearch(row.label, searchTerm) ||
            matchesSearch(section.title, searchTerm),
        );
        if (rows.length === 0) return [];

        return [
          {
            key: section.title,
            title: section.title,
            rows: rows.map(row => ({
              key: row.key,
              cells: {
                label: (
                  <span className={row.isGroup ? "pl-6" : undefined}>
                    {row.label}
                  </span>
                ),
                alerts: commaNumber(row.alerts),
                priority: row.priority ?? "",
              },
            })),
          },
        ];
      }),
    [sections, searchTerm],
  );

  return (
    <>
      <SummarySearch onChange={setSearchTerm} />
      <SummaryTable
        columns={[
          { key: "label", header: title },
          { key: "alerts", header: "Alerts", align: "right" },
          { key: "priority", header: "Priority", align: "right" },
        ]}
        groups={groups}
      />
    </>
  );
};

export default DqSectionTable;
