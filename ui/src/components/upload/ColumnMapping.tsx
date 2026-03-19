import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  memo,
  useState,
} from "react";
import {
  FieldValues,
  UseFormResetField,
  useFormContext,
} from "react-hook-form";

import { Warning } from "@carbon/icons-react";
import { Select, SelectItem } from "@carbon/react";
import {
  FloatingPortal,
  autoUpdate,
  offset,
  shift,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";

import { FIELD_FORMAT_INFO } from "@/constants/columnFieldInfo.ts";
import { licenseOptions } from "@/mocks/metadataFormValues.tsx";
import { MetaSchema } from "@/types/schema.ts";

export interface ConfigureColumnsForm {
  mapping: Record<string, string>;
  license: Record<string, string>;
}

function buildTooltipContent(column: MetaSchema) {
  const fallback = FIELD_FORMAT_INFO[column.name];

  const type = column.data_type || fallback?.type;
  const hint = column.hint || fallback?.examples;
  const units = column.units;

  const hasExtra = type || hint || units;
  if (!column.description && !hasExtra) return null;

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

interface ColumnTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

function ColumnTooltip({ content, children }: ColumnTooltipProps) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "right",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), shift({ padding: 8 })],
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 max-w-xs rounded bg-[#393939] px-4 py-3 text-sm text-white shadow-lg"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

interface BaseColumnProps {
  column: MetaSchema;
}

type MasterColumnProps = BaseColumnProps;

export const MasterColumn = memo(({ column }: MasterColumnProps) => {
  const tooltipContent = buildTooltipContent(column);

  const label = (
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
  );

  return (
    <div className="flex items-center gap-4">
      {tooltipContent ? (
        <ColumnTooltip content={tooltipContent}>{label}</ColumnTooltip>
      ) : (
        label
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

  const isSchoolIdGovt = column.name === "school_id_govt";
  const shouldDisableLicense = disabled || (isMandatory && !isSchoolIdGovt);

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
