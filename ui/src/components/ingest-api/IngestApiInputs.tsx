import { Controller, UseFormReturn } from "react-hook-form";

import {
  Button,
  NumberInput as CarbonNumberInput,
  TextInput as CarbonTextInput,
  Loading,
  SelectItem,
  TextArea,
  Toggle,
} from "@carbon/react";

import { Select } from "@/components/forms/Select.tsx";
import { TextInput } from "@/components/forms/TextInput.tsx";
import {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";

interface BaseInputProps<MappingType> {
  mapping: IngestApiFormMapping<MappingType>;
  hookForm: UseFormReturn<SchoolListFormSchema | SchoolConnectivityFormSchema>;
}

export function FreeTextInput<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <TextInput
      id={name}
      labelText={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      placeholder={mapping.placeholder}
      helperText={
        <span className="whitespace-pre-line">{mapping.helperText}</span>
      }
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      {...register(name, {
        required: mapping.required,
        onChange: mapping.onChange,
      })}
    />
  );
}

export function PasswordInput<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}//
    <CarbonTextInput.PasswordInput
      id={name}
      autoComplete="off"
      labelText={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      {...register(name, {
        required: mapping.required,
        onChange: mapping.onChange,
      })}
    />
  );
}

export function CodeInput<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <TextArea
      id={name}
      labelText={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      helperText={
        <span className="whitespace-pre-line">{mapping.helperText}</span>
      }
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      placeholder={mapping.placeholder}
      {...register(name, {
        required: mapping.required,
        onChange: mapping.onChange,
      })}
    />
  );
}

export function SelectFromArray<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <Select
      id={name}
      labelText={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      helperText={mapping.helperText}
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      {...register(name, {
        required: mapping.required,
        onChange: mapping.onChange,
      })}
    >
      <SelectItem text="" value="" />
      {mapping.type === "select-user"
        ? mapping.options.map(user => (
            <SelectItem
              key={user.id}
              text={`${user.display_name} (${user.mail})`}
              value={user.id}
            />
          ))
        : mapping.type === "select"
        ? mapping.options.map(option => (
            <Select id={option} key={option} value={option} />
          ))
        : null}
    </Select>
  );
}

export function SelectFromObjectArray<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <Select
      id={name}
      labelText={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      helperText={mapping.helperText}
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      {...register(name, {
        required: mapping.required,
        onChange: mapping.onChange,
      })}
    >
      <SelectItem text="" value="" />
      {mapping.type === "select-object" &&
        mapping.options.map(option => (
          <SelectItem
            id={option[mapping.valueAccessor]}
            key={option[mapping.valueAccessor]}
            text={option[mapping.labelAccessor]}
            value={option[mapping.valueAccessor]}
          />
        ))}
    </Select>
  );
}

interface SelectFromEnumProps<MappingType> extends BaseInputProps<MappingType> {
  mapping: Extract<IngestApiFormMapping<MappingType>, { type: "enum" }>;
}

export function SelectFromEnum<MappingType>({
  mapping,
  hookForm,
}: SelectFromEnumProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <Select
      id={name}
      labelText={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      helperText={mapping.helperText}
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      {...register(name, {
        required: mapping.required,
        onChange: mapping.onChange,
      })}
    >
      <SelectItem text="" value="" />
      {mapping.enum.map(el => (
        <SelectItem key={el} text={el.replace("_", " ")} value={el} />
      ))}
    </Select>
  );
}

interface TextInputWithActionProps<MappingType>
  extends BaseInputProps<MappingType> {
  onAction: () => void;
  actionLabel: string;
  isActionLoading?: boolean;
}

export function TextInputWithAction<MappingType>({
  mapping,
  hookForm,
  onAction,
  actionLabel,
  isActionLoading = false,
}: TextInputWithActionProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <div className="flex items-start">
      <TextInput
        id={name}
        labelText={
          <>
            {mapping.label}
            {mapping.required && <sup className="text-giga-red">*</sup>}
          </>
        }
        placeholder={mapping.placeholder}
        invalid={name in errors}
        invalidText={
          <span className="whitespace-pre-line">
            {errors[name]?.message as string}
            <br />
            {mapping.helperText}
          </span>
        }
        {...register(name, {
          required: mapping.required,
          onChange: mapping.onChange,
        })}
      />
      <div>
        <Button
          size="md"
          onClick={onAction}
          renderIcon={props =>
            isActionLoading ? (
              <Loading small={true} withOverlay={false} {...props} />
            ) : null
          }
          disabled={isActionLoading}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

export function Switch<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const { control, setValue } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value } }) => (
        <Toggle
          id={name}
          labelText={mapping.label}
          toggled={Boolean(value)}
          // @ts-expect-error wrong type
          onToggle={value => setValue(name, value)}
        />
      )}
    />
  );
}

export function NumberInput<MappingType>({
  mapping,
  hookForm,
}: BaseInputProps<MappingType>) {
  const {
    register,
    formState: { errors },
  } = hookForm;
  const name = mapping.name as keyof (
    | SchoolListFormSchema
    | SchoolConnectivityFormSchema
  );

  const registerReturn = register(name, {
    required: mapping.required,
    onChange: mapping.onChange,
  });

  return (
    <CarbonNumberInput
      id={name}
      invalid={name in errors}
      invalidText={
        <span className="whitespace-pre-line">
          {errors[name]?.message as string}
          <br />
          {mapping.helperText}
        </span>
      }
      label={
        <>
          {mapping.label}
          {mapping.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      helperText={mapping.helperText}
      {...registerReturn}
      min={
        typeof registerReturn.min === "string"
          ? parseInt(registerReturn.min, 10)
          : registerReturn.min
      }
      max={
        typeof registerReturn.max === "string"
          ? parseInt(registerReturn.max, 10)
          : registerReturn.max
      }
    />
  );
}
