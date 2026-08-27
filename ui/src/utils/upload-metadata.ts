import { health, metadataMapping } from "@/constants/metadata";

/** Mirrors `buildMetadataRows` in the DQ report PDF so both surfaces match. */
const DISPLAYED_KEYS = [
  "description",
  "focal_point_name",
  "focal_point_contact",
  "data_owner",
  "year_of_data_collection",
  "modality_of_data_collection",
  "school_ids_type",
  "emis_system",
  "frequency_of_school_data_collection",
  "next_school_data_collection",
] as const;

const EM_DASH = "—";

/** The form label is a full question; the value may be a name or a yes/no. */
const LABEL_OVERRIDES: Record<string, string> = {
  emis_system: "EMIS system",
};

/** The API stringifies values with `str()`, so blanks arrive as "None". */
export function formatMetadataValue(value: string | undefined | null): string {
  if (value == null) return EM_DASH;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "None") return EM_DASH;
  return trimmed;
}

function labelsForDataset(dataset: string): Record<string, string> {
  const mapping = dataset === "health" ? health : metadataMapping;
  return Object.fromEntries(
    Object.values(mapping)
      .flat()
      .map(field => [field.name, field.label]),
  );
}

export interface UploadMetadataRow {
  key: string;
  label: string;
  value: string;
}

export function getUploadMetadataRows(
  metadata: Record<string, string> | null | undefined,
  dataset: string,
): UploadMetadataRow[] {
  if (!metadata) return [];

  const labels = labelsForDataset(dataset);

  const rows = DISPLAYED_KEYS.map(key => {
    const raw =
      key === "emis_system"
        ? metadata.emis_system_name || metadata.emis_system
        : metadata[key];

    return {
      key,
      label: LABEL_OVERRIDES[key] ?? labels[key] ?? key,
      value: formatMetadataValue(raw),
    };
  });

  return rows.every(row => row.value === EM_DASH) ? [] : rows;
}
