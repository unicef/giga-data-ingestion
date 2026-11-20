import { useMemo, useState } from "react";

import { DqReportSection, matchesSearch } from "@/utils/dq-summary";

import {
  AlertCount,
  SummarySearch,
  SummaryTable,
  SummaryTableGroup,
} from "./SummaryTable";

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
                    {row.isGroup && <span aria-hidden="true">↳ </span>}
                    {row.label}
                  </span>
                ),
                alerts: <AlertCount value={row.alerts} />,
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
          {
            key: "alerts",
            header: "Alerts",
            align: "right",
            widthClass: "w-32",
          },
          {
            key: "priority",
            header: "Priority",
            align: "right",
            widthClass: "!w-40",
          },
        ]}
        groups={groups}
      />
    </>
  );
};

export default DqSectionTable;
