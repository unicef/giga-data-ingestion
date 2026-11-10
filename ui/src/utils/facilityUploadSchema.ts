import { MetaSchema } from "@/types/schema.ts";
import { RegistryColumn } from "@/types/schemaRegistry.ts";

export const FACILITY_ID_COLUMN = "facility_id_govt";
export const FACILITIES_GROUP_KEY = "facilities";

/** Always-required ID for facility geolocation updates/creates. */
export function isFacilityIdColumn(name: string) {
  return name === FACILITY_ID_COLUMN;
}

export function isAlwaysRequiredColumn(column: RegistryColumn) {
  if (isFacilityIdColumn(column.name)) return true;
  if (!column.is_mandatory) return false;
  return column.critical_for !== "create_only";
}

export function isCreateRequiredColumn(column: RegistryColumn) {
  return Boolean(column.is_mandatory && column.critical_for === "create_only");
}

/** Only government-sourced, non–system-generated columns are uploadable. */
export function isFacilityUploadColumn(column: RegistryColumn) {
  return column.source === "government" && column.is_system_generated !== true;
}

export function filterFacilityUploadColumns(columns: RegistryColumn[]) {
  return columns.filter(isFacilityUploadColumn);
}

/** Adapt registry/resolved columns for the existing column-mapping UI. */
export function registryColumnsToMetaSchema(
  columns: RegistryColumn[],
): MetaSchema[] {
  return filterFacilityUploadColumns(columns).map(column => {
    const alwaysRequired = isAlwaysRequiredColumn(column);
    const createRequired = isCreateRequiredColumn(column);
    return {
      id: column.name,
      name: column.name,
      data_type: column.data_type,
      is_nullable: alwaysRequired
        ? false
        : createRequired
        ? true
        : column.is_nullable ?? true,
      is_important: column.is_important,
      is_system_generated: column.is_system_generated,
      description: column.description,
      primary_key: column.primary_key,
      partition_order: column.partition_order,
      license: column.license,
      units: column.units,
      hint: column.hint,
      is_create_required: createRequired,
    };
  });
}
