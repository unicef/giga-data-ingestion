import { useEffect, useState } from "react";

import { Close } from "@carbon/icons-react";
import { Button, Checkbox } from "@carbon/react";

export interface ColumnConfig {
  key: string;
  label: string;
  alwaysVisible?: boolean;
}

export const ALL_COLUMN_CONFIGS: ColumnConfig[] = [
  { key: "id", label: "Upload ID", alwaysVisible: true },
  { key: "created", label: "Upload date" },
  { key: "uploader_email", label: "Uploaded by" },
  { key: "dataset", label: "Dataset" },
  { key: "country", label: "Country" },
  { key: "rows", label: "Total entries" },
  { key: "rows_passed", label: "Records Passed" },
  { key: "rows_failed", label: "Records Rejected" },
  { key: "data_owner", label: "Data Owner" },
  { key: "status", label: "DQ status" },
];

export const DEFAULT_VISIBLE_COLUMNS = new Set([
  "id",
  "created",
  "uploader_email",
  "dataset",
  "country",
  "rows",
  "rows_failed",
  "status",
]);

const MAX_VISIBLE = 9;
const STORAGE_KEY = "uploads_table_visible_columns";

export function loadVisibleColumns(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {
    // ignore
  }
  return new Set(DEFAULT_VISIBLE_COLUMNS);
}

export function saveVisibleColumns(cols: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...cols]));
}

interface ColumnSelectorModalProps {
  open: boolean;
  onClose: () => void;
  visibleColumns: Set<string>;
  onSave: (cols: Set<string>) => void;
}

export default function ColumnSelectorModal({
  open,
  onClose,
  visibleColumns,
  onSave,
}: ColumnSelectorModalProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(visibleColumns));

  useEffect(() => {
    if (open) setDraft(new Set(visibleColumns));
  }, [open, visibleColumns]);

  const toggleableColumns = ALL_COLUMN_CONFIGS.filter(c => !c.alwaysVisible);
  const selectedCount = draft.size;
  const atMax = selectedCount >= MAX_VISIBLE;

  function toggle(key: string, checked: boolean) {
    const next = new Set(draft);
    if (checked) next.add(key);
    else next.delete(key);
    setDraft(next);
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  function handleReset() {
    setDraft(new Set(DEFAULT_VISIBLE_COLUMNS));
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[8999] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side panel */}
      <div
        role="dialog"
        aria-label="Column selector"
        className="fixed right-0 top-0 z-[9000] flex h-full w-80 flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--cds-border-subtle)] px-4 py-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--cds-text-primary)]">
              Columns
            </h3>
            <p className="mt-0.5 text-xs text-[var(--cds-text-secondary)]">
              {selectedCount} selected (max. {MAX_VISIBLE})
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-[var(--cds-icon-primary)] hover:text-[var(--cds-icon-secondary)]"
            aria-label="Close"
          >
            <Close size={20} />
          </button>
        </div>

        {/* Column list */}
        <div className="flex-1 overflow-y-auto">
          {/* Always-visible column */}
          <div className="flex items-center border-b border-[var(--cds-border-subtle)] px-4 py-3 opacity-40">
            <div className="flex-1">
              <Checkbox id="col-id" labelText="Upload ID" checked disabled />
            </div>
          </div>

          {/* Toggleable columns */}
          {toggleableColumns.map(col => {
            const isChecked = draft.has(col.key);
            const isDisabled = !isChecked && atMax;
            return (
              <div
                key={col.key}
                className="flex items-center border-b border-[var(--cds-border-subtle)] px-4 py-3"
              >
                <div className="flex-1">
                  <Checkbox
                    id={`col-${col.key}`}
                    labelText={col.label}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={(_: unknown, { checked }: { checked: boolean }) =>
                      toggle(col.key, checked)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex border-t border-[var(--cds-border-subtle)]">
          <Button kind="ghost" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
          <Button kind="primary" className="flex-1" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
