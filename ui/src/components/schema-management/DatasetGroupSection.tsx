import { Add } from "@carbon/icons-react";
import { Button, Tag } from "@carbon/react";
import { Link } from "@tanstack/react-router";

import { DatasetGroup, SchemaDataset } from "@/types/schemaRegistry.ts";

interface DatasetGroupSectionProps {
  group: DatasetGroup | null;
  datasets: SchemaDataset[];
  onAddDatasets?: () => void;
}

function DatasetGroupSection({
  group,
  datasets,
  onAddDatasets,
}: DatasetGroupSectionProps) {
  return (
    <div className="rounded-lg border border-giga-gray/40 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-giga-light-gray px-4 py-3">
        <div>
          <h3 className="font-semibold">{group ? group.name : "Ungrouped"}</h3>
          {group?.description ? (
            <p className="text-xs text-giga-dark-gray">{group.description}</p>
          ) : !group ? (
            <p className="text-xs text-giga-dark-gray">
              Not yet assigned to a group
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-giga-dark-gray">
            {datasets.length} dataset{datasets.length === 1 ? "" : "s"}
          </span>
          {group && onAddDatasets && (
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Add}
              onClick={onAddDatasets}
            >
              Add datasets
            </Button>
          )}
        </div>
      </div>

      {datasets.length === 0 ? (
        <p className="px-4 py-4 text-sm text-giga-dark-gray">
          {group
            ? "No datasets in this group yet — use “Add datasets” to assign some."
            : "Every dataset is assigned to a group."}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-giga-light-gray text-left text-xs uppercase text-giga-dark-gray">
              <th className="px-4 py-2 font-medium">Dataset</th>
              <th className="px-4 py-2 font-medium">Columns</th>
              <th className="px-4 py-2 font-medium">Pending</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {datasets.map(dataset => (
              <tr
                key={dataset.id}
                className="border-b border-giga-light-gray last:border-0"
              >
                <td className="px-4 py-2" colSpan={4}>
                  <Link
                    className="-mx-4 -my-2 flex items-center gap-4 px-4 py-2 text-giga-black no-underline hover:bg-giga-light-blue"
                    to="/schema-management/$datasetKey"
                    params={{ datasetKey: dataset.key }}
                  >
                    <span className="min-w-0 flex-1 font-mono text-xs">
                      {dataset.key}
                    </span>
                    <span className="w-20 text-sm">{dataset.column_count}</span>
                    <span className="w-28">
                      {dataset.pending_proposal_count > 0 ? (
                        <Tag type="magenta" size="sm">
                          {dataset.pending_proposal_count} pending
                        </Tag>
                      ) : (
                        <span className="text-giga-gray">—</span>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-giga-dark-blue">
                      Open →
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DatasetGroupSection;
