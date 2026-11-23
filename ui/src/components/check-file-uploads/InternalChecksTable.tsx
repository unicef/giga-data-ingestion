import { useMemo, useState } from "react";

import { DefinitionTooltip } from "@carbon/react";

import {
  INTERNAL_CHECK_COLUMNS,
  InternalCheckCategory,
  matchesSearch,
} from "@/utils/dq-summary";
import { commaNumber } from "@/utils/number";

import {
  AlertCount,
  SummarySearch,
  SummaryTable,
  SummaryTableGroup,
} from "./SummaryTable";

const PRECISION_NOTE =
  "Includes the precision check: coordinates with fewer than 5 decimal places.";

interface InternalChecksTableProps {
  categories: InternalCheckCategory[];
}

const InternalChecksTable = ({ categories }: InternalChecksTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const groups = useMemo<SummaryTableGroup[]>(
    () =>
      categories.flatMap(category => {
        const rows = category.rows.filter(
          row =>
            matchesSearch(row.column, searchTerm) ||
            matchesSearch(category.title, searchTerm),
        );
        if (rows.length === 0) return [];

        return [
          {
            key: category.title,
            title: category.title,
            rows: rows.map(row => ({
              key: row.column,
              cells: {
                column: (
                  <>
                    {row.column}
                    {row.tag && (
                      <span className="ml-1 text-gray-500">({row.tag})</span>
                    )}
                  </>
                ),
                ...Object.fromEntries(
                  INTERNAL_CHECK_COLUMNS.map(({ key }) => {
                    const value = row.counts[key];
                    if (value === null) {
                      return [key, <span className="text-gray-400">—</span>];
                    }
                    if (key === "passed") return [key, commaNumber(value)];
                    if (key === "domain" && row.domainIncludesPrecision) {
                      return [
                        key,
                        <DefinitionTooltip
                          align="left"
                          definition={PRECISION_NOTE}
                          openOnHover
                        >
                          <AlertCount value={value} />
                        </DefinitionTooltip>,
                      ];
                    }
                    return [key, <AlertCount value={value} />];
                  }),
                ),
              },
            })),
          },
        ];
      }),
    [categories, searchTerm],
  );

  return (
    <>
      <SummarySearch onChange={setSearchTerm} />
      <SummaryTable
        columns={[
          { key: "column", header: "Internal checks" },
          ...INTERNAL_CHECK_COLUMNS.map(({ key, header }) => ({
            key,
            header,
            align: "right" as const,
          })),
        ]}
        groups={groups}
        emptyMessage="No column checks are available for this upload."
      />
    </>
  );
};

export default InternalChecksTable;
