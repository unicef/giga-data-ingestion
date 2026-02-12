import React, { ChangeEvent, Dispatch, SetStateAction, memo } from "react";
import {
  FieldValues,
  UseFormResetField,
  useFormContext,
} from "react-hook-form";

import { Warning } from "@carbon/icons-react";
import { DefinitionTooltip, Select, SelectItem } from "@carbon/react";

import { licenseOptions } from "@/mocks/metadataFormValues.tsx";
import { MetaSchema } from "@/types/schema.ts";

export interface ConfigureColumnsForm {
  mapping: Record<string, string>;
  license: Record<string, string>;
}

// Field type and format information for enhanced mapping tooltips
const FIELD_FORMAT_INFO: Record<string, { type: string; examples?: string }> = {
  // ── School profile ──────────────────────────────────────────────────
  school_id_giga: { type: "string" },
  school_id_govt: { type: "string" },
  school_id_govt_type: {
    type: "string",
    examples: 'e.g., "EMIS", "Examination Board"',
  },
  school_name: { type: "string" },
  latitude: { type: "float" },
  longitude: { type: "float" },
  source_lat_lon: { type: "string" },
  school_address: { type: "string" },
  education_level: {
    type: "string",
    examples: 'e.g., "Primary", "Secondary", "Post-Secondary"',
  },
  education_level_govt: {
    type: "string",
    examples: 'e.g., "Primary", "Secondary"',
  },
  school_establishment_year: { type: "integer", examples: "e.g., 1995" },
  is_school_open: { type: "string", examples: '"Yes" or "No"' },
  school_area_type: { type: "string", examples: 'e.g., "Urban", "Rural"' },
  school_funding_type: {
    type: "string",
    examples: 'e.g., "Public", "Private"',
  },
  building_id_govt: { type: "string" },

  // ── School connectivity ─────────────────────────────────────────────
  connectivity: { type: "string", examples: 'e.g., "Yes", "No"' },
  connectivity_govt: { type: "string", examples: 'e.g., "Yes", "No"' },
  connectivity_type_govt: {
    type: "string",
    examples: 'e.g., "fiber", "satellite"',
  },
  connectivity_RT: { type: "string", examples: '"Yes" or "No"' },
  connectivity_RT_datasource: { type: "string" },
  connectivity_RT_ingestion_timestamp: { type: "string (ISO 8601)" },
  connectivity_govt_ingestion_timestamp: { type: "string (ISO 8601)" },
  connectivity_govt_collection_year: {
    type: "integer",
    examples: "e.g., 2023",
  },
  download_speed_govt: { type: "number", examples: "in Mbps" },
  download_speed_contracted: { type: "number", examples: "in Mbps" },
  download_speed_benchmark: { type: "number", examples: "in Mbps" },
  electricity_availability: { type: "string", examples: '"Yes" or "No"' },
  electricity_type: {
    type: "string",
    examples: 'e.g., "solar", "electrical grid"',
  },

  // ── School ICT resources ────────────────────────────────────────────
  computer_availability: { type: "string", examples: '"Yes" or "No"' },
  device_availability: { type: "string", examples: '"Yes" or "No"' },
  computer_lab: { type: "string", examples: '"Yes" or "No"' },
  num_computers: { type: "integer" },
  num_computers_desired: { type: "integer" },
  num_tablets: { type: "integer" },
  num_robotic_equipment: { type: "integer" },
  teachers_trained: { type: "integer" },
  computer_govt_collection_year: { type: "integer", examples: "e.g., 2023" },

  // ── School facilities ───────────────────────────────────────────────
  num_classrooms: { type: "integer" },
  num_latrines: { type: "integer" },
  water_availability: { type: "string", examples: '"Yes" or "No"' },
  refugee_camp: { type: "string", examples: '"Yes" or "No"' },
  num_schools_per_building: { type: "integer" },

  // ── Demographics ────────────────────────────────────────────────────
  num_students: { type: "integer" },
  num_teachers: { type: "integer" },
  num_adm_personnel: { type: "integer" },

  // ── Administrative regions ──────────────────────────────────────────
  admin1: { type: "string" },
  admin2: { type: "string" },
  admin1_id_giga: { type: "string" },
  admin2_id_giga: { type: "string" },
  disputed_region: { type: "string" },

  // ── Coverage / distance metrics ─────────────────────────────────────
  cellular_coverage_availability: { type: "string", examples: '"Yes" or "No"' },
  cellular_coverage_type: {
    type: "string",
    examples: 'e.g., "2G", "3G", "4G", "5G"',
  },
  fiber_node_distance: { type: "number", examples: "in km" },
  microwave_node_distance: { type: "number", examples: "in km" },
  nearest_LTE_distance: { type: "number", examples: "in km" },
  nearest_UMTS_distance: { type: "number", examples: "in km" },
  nearest_GSM_distance: { type: "number", examples: "in km" },
  nearest_NR_distance: { type: "number", examples: "in km" },
  nearest_school_distance: { type: "number", examples: "in km" },
  nearest_LTE_id: { type: "string" },
  nearest_UMTS_id: { type: "string" },
  nearest_GSM_id: { type: "string" },
  nearest_NR_id: { type: "string" },

  // ── Population / schools nearby ─────────────────────────────────────
  pop_within_1km: { type: "integer" },
  pop_within_2km: { type: "integer" },
  pop_within_3km: { type: "integer" },
  pop_within_10km: { type: "integer" },
  schools_within_1km: { type: "integer" },
  schools_within_2km: { type: "integer" },
  schools_within_3km: { type: "integer" },
  schools_within_10km: { type: "integer" },

  // ── Other / metadata ────────────────────────────────────────────────
  school_location_ingestion_timestamp: { type: "string (ISO 8601)" },
  school_data_collection_year: { type: "integer", examples: "e.g., 2023" },
  school_data_source: { type: "string" },
  school_data_collection_modality: { type: "string" },
  sustainable_business_model: { type: "string" },

  // ── System timestamps ───────────────────────────────────────────────
  created_at: { type: "string (ISO 8601)" },
  updated_at: { type: "string (ISO 8601)" },
  deleted_at: { type: "string or null" },
};

function buildTooltipDefinition(column: MetaSchema) {
  const fallback = FIELD_FORMAT_INFO[column.name];

  // Prefer API fields; fall back to the local FIELD_FORMAT_INFO constant
  const type = column.data_type || fallback?.type;
  const hint = column.hint || fallback?.examples;
  const units = column.units;

  const hasExtra = type || hint || units;
  if (!column.description && !hasExtra) return null;

  // Build a compact "Type: string — in Mbps — e.g. ..." line
  const extraParts: string[] = [];
  if (type) extraParts.push(type);
  if (units) extraParts.push(units);
  if (hint) extraParts.push(hint);

  return (
    <div className="flex flex-col gap-1">
      {column.description && <span>{column.description}</span>}
      {extraParts.length > 0 && (
        <span className="text-xs opacity-80">
          <strong>Type:</strong> {extraParts.join(" — ")}
        </span>
      )}
    </div>
  );
}

interface BaseColumnProps {
  column: MetaSchema;
}

type MasterColumnProps = BaseColumnProps;

export const MasterColumn = memo(({ column }: MasterColumnProps) => {
  const tooltipDefinition = buildTooltipDefinition(column);

  return (
    <div className="flex items-center gap-4">
      {tooltipDefinition ? (
        <DefinitionTooltip
          align="right"
          definition={tooltipDefinition}
          openOnHover
        >
          <div className="flex items-center gap-1">
            <div>{column.name}</div>
            <div>
              {!column.is_nullable ? (
                <span className="text-giga-red">*</span>
              ) : column.is_important ? (
                <Warning className="text-purple-600" />
              ) : null}
            </div>
          </div>
        </DefinitionTooltip>
      ) : (
        <div className="flex items-center gap-1">
          <div>{column.name}</div>
          <div>
            {!column.is_nullable ? (
              <span className="text-giga-red">*</span>
            ) : column.is_important ? (
              <Warning className="text-purple-600" />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
});

interface DetectedColumnProps extends BaseColumnProps {
  detectedColumns: string[];
  selectedColumns: Record<string, string>;
  setSelectedColumns: Dispatch<SetStateAction<Record<string, string>>>;
}

const handleSelectOnChange = ({
  resetField,
  selectedColumn,
  expectedColumn,
  setSelectedColumns,
}: {
  resetField: UseFormResetField<FieldValues>;
  selectedColumn: string;
  expectedColumn: string;
  setSelectedColumns: Dispatch<SetStateAction<Record<string, string>>>;
}) => {
  if (selectedColumn === "") {
    setSelectedColumns(old => {
      resetField(`license.${expectedColumn}`);

      const copy = { ...old };
      delete copy[expectedColumn];
      return copy;
    });
  } else {
    setSelectedColumns(old => {
      return { ...old, [expectedColumn]: selectedColumn };
    });
  }
};

export const DetectedColumn = memo(
  ({
    column,
    detectedColumns,
    selectedColumns,
    setSelectedColumns,
  }: DetectedColumnProps) => {
    const {
      formState: { errors },
      register,
      resetField,
    } = useFormContext();

    return (
      <div className="w-11/12 px-2 pb-2">
        <Select
          id={`mapping.${column.name}`}
          invalid={column.name in (errors.mapping ?? {})}
          labelText=""
          {...register(`mapping.${column.name}`, {
            required: !column.is_nullable,
            onChange: (e: ChangeEvent<HTMLInputElement>) => {
              handleSelectOnChange({
                resetField: resetField,
                selectedColumn: e.target.value,
                expectedColumn: column.name,
                setSelectedColumns: setSelectedColumns,
              });
            },
          })}
        >
          <SelectItem text="" value="" />
          {detectedColumns
            .filter(
              detectedColumn =>
                !Object.values(selectedColumns).includes(detectedColumn) ||
                selectedColumns[column.name] === detectedColumn,
            )
            .map(col => (
              <SelectItem key={col} text={col} value={col} />
            ))}
        </Select>
      </div>
    );
  },
);

type ColumnLicenseProps = BaseColumnProps;

export const ColumnLicense = memo(({ column }: ColumnLicenseProps) => {
  const {
    formState: { errors },
    register,
    watch,
    setValue,
  } = useFormContext();

  const disabled = !watch(`mapping.${column.name}`);
  const isMandatory = !column.is_nullable;

  // Allow school_id_govt to change license even though it's mandatory
  const isSchoolIdGovt = column.name === "school_id_govt";
  const shouldDisableLicense = disabled || (isMandatory && !isSchoolIdGovt);

  // Set mandatory columns to ODBL by default and disable changes (except school_id_govt)
  React.useEffect(() => {
    if (isMandatory && !isSchoolIdGovt && watch(`mapping.${column.name}`)) {
      setValue(`license.${column.name}`, "ODBL");
    }
  }, [isMandatory, isSchoolIdGovt, column.name, setValue, watch]);

  return (
    <div className="w-full">
      <Select
        id={`license.${column.name}`}
        invalid={column.name in (errors.license ?? {})}
        labelText=""
        {...register(`license.${column.name}`, {
          validate: (value, formValues) =>
            !!value && !!formValues.mapping[column.name],
          disabled: shouldDisableLicense,
          deps: [`mapping.${column.name}`],
        })}
      >
        <SelectItem text={licenseOptions[0]} value={licenseOptions[0]} />
        {licenseOptions.map((license, index) => {
          if (index == 0) return null;

          return <SelectItem key={license} text={license} value={license} />;
        })}
      </Select>
    </div>
  );
});
