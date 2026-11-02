import { Add } from "@carbon/icons-react";
import { Button, Select, SelectItem, Tag } from "@carbon/react";
import { Link } from "@tanstack/react-router";

import { DatasetGroup, SchemaDataset } from "@/types/schemaRegistry.ts";

interface DatasetGroupSectionProps {
  group: DatasetGroup | null;
  datasets: SchemaDataset[];
  groups: DatasetGroup[];
  onAddDatasets?: () => void;
  onMove: (datasetKey: string, groupId: string | null) => void;
}

function DatasetGroupSection({
  group,
  datasets,
  groups,
  onAddDatasets,
  onMove,
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
                <td className="px-4 py-2 font-mono text-xs">{dataset.key}</td>
                <td className="px-4 py-2">{dataset.column_count}</td>
                <td className="px-4 py-2">
                  {dataset.pending_proposal_count > 0 ? (
                    <Tag type="magenta" size="sm">
                      {dataset.pending_proposal_count} pending
                    </Tag>
                  ) : (
                    <span className="text-giga-gray">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      className="cds--link text-xs"
                      to="/schema-management/$datasetKey"
                      params={{ datasetKey: dataset.key }}
                    >
                      View columns
                    </Link>
                    <Select
                      id={`move-group-${dataset.id}`}
                      labelText=""
                      hideLabel
                      size="sm"
                      value={group?.id ?? ""}
                      onChange={e =>
                        onMove(dataset.key, e.target.value || null)
                      }
                    >
                      <SelectItem text="No group" value="" />
                      {groups.map(candidate => (
                        <SelectItem
                          key={candidate.id}
                          text={candidate.name}
                          value={candidate.id}
                        />
                      ))}
                    </Select>
                  </div>
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
