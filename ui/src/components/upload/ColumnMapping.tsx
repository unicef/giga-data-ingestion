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

interface BaseColumnProps {
  column: MetaSchema;
}

type MasterColumnProps = BaseColumnProps;

export const MasterColumn = memo(({ column }: MasterColumnProps) => {
  return (
    <div className="flex items-center gap-4">
      {column.description ? (
        <DefinitionTooltip
          align="right"
          definition={column.description}
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

  // Set mandatory columns to ODBL by default and disable changes
  React.useEffect(() => {
    if (isMandatory && watch(`mapping.${column.name}`)) {
      setValue(`license.${column.name}`, "ODBL");
    }
  }, [isMandatory, column.name, setValue, watch]);

  return (
    <div className="w-full">
      <Select
        id={`license.${column.name}`}
        invalid={column.name in (errors.license ?? {})}
        labelText=""
        {...register(`license.${column.name}`, {
          validate: (value, formValues) =>
            !!value && !!formValues.mapping[column.name],
          disabled: disabled || isMandatory,
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
