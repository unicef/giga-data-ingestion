import { memo } from "react";
import { useFormContext } from "react-hook-form";

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
}

export const DetectedColumn = memo(
  ({ column, detectedColumns }: DetectedColumnProps) => {
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
            onChange: e => {
              if (e.target.value === "") {
                resetField(`license.${column.name}`);
              }
            },
          })}
        >
          <SelectItem text="" value="" />
          {detectedColumns.map(col => (
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
  } = useFormContext();

  const disabled = !watch(`mapping.${column.name}`);

  return (
    <div className="w-full">
      <Select
        id={`license.${column.name}`}
        invalid={column.name in (errors.license ?? {})}
        labelText=""
        {...register(`license.${column.name}`, {
          validate: (value, formValues) =>
            !!value && !!formValues.mapping[column.name],
          disabled: disabled,
          deps: [`mapping.${column.name}`],
        })}
      >
        <SelectItem text="" value="" />
        {licenseOptions.map(license => (
          <SelectItem key={license} text={license} value={license} />
        ))}
      </Select>
    </div>
  );
});
