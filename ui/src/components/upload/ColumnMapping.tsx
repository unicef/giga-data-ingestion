import { ChangeEvent, Dispatch, SetStateAction, memo } from "react";
import {
  FieldValues,
  UseFormResetField,
  useFormContext,
} from "react-hook-form";

import { Warning } from "@carbon/icons-react";
import { Checkbox, DefinitionTooltip, Select, SelectItem } from "@carbon/react";

import { licenseOptions } from "@/mocks/metadataFormValues.tsx";
import { MetaSchema } from "@/types/schema.ts";

export interface ConfigureColumnsForm {
  mapping: Record<string, string>;
  license: Record<string, string>;
}

interface BaseColumnProps {
  column: MetaSchema;
}

interface SelectableColumnProps extends BaseColumnProps {
  isSelected: boolean;
  onSelect: (columnName: string, isChecked: boolean) => void;
  hasDetectedColumn: boolean;
}

export const MasterColumn = memo(
  ({
    column,
    isSelected,
    onSelect,
    hasDetectedColumn,
  }: SelectableColumnProps) => {
    return (
      <div className="flex items-center gap-4">
        <Checkbox
          id={`select-${column.name}`}
          labelText=""
          checked={isSelected}
          disabled={!hasDetectedColumn}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const { checked } = event.target;
            onSelect(column.name, checked);
          }}
        />
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
  },
);

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
      resetField(`license.${selectedColumn}`);
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
                resetField,
                selectedColumn: e.target.value,
                expectedColumn: column.name,
                setSelectedColumns,
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

type ColumnLicenseProps = BaseColumnProps & { disabled: boolean };

export const ColumnLicense = memo(
  ({ column, disabled }: ColumnLicenseProps) => {
    const {
      formState: { errors },
      register,
      watch,
    } = useFormContext();

    const isDisabled = disabled || !watch(`mapping.${column.name}`);

    return (
      <div className="w-full">
        <Select
          id={`license.${column.name}`}
          invalid={column.name in (errors.license ?? {})}
          labelText=""
          {...register(`license.${column.name}`, {
            validate: (value, formValues) =>
              !!value && !!formValues.mapping[column.name],
            disabled: isDisabled,
            deps: [`mapping.${column.name}`],
          })}
        >
          <SelectItem text={licenseOptions[0]} value={licenseOptions[0]} />
          {licenseOptions.map((license, index) => {
            if (index === 0) return null;
            return <SelectItem key={license} text={license} value={license} />;
          })}
        </Select>
      </div>
    );
  },
);
