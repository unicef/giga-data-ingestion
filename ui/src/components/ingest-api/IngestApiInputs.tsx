import { FieldErrors, UseFormRegisterReturn } from "react-hook-form";

import {
  Button,
  TextInput as CarbonTextInput,
  Loading,
  SelectItem,
  TextArea,
} from "@carbon/react";

import { Select } from "@/components/forms/Select.tsx";
import { TextInput } from "@/components/forms/TextInput.tsx";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";

interface BaseInputProps<MappingType> {
  mapping: IngestApiFormMapping<MappingType>;
  errors: FieldErrors;
  register: UseFormRegisterReturn;
}

export function FreeTextInput<MappingType>({
  mapping,
  errors,
  register,
}: BaseInputProps<MappingType>) {
  return (
    <TextInput
      id={mapping.name}
      labelText={mapping.label}
      helperText={
        <span className="whitespace-pre-line">{mapping.helperText}</span>
      }
      invalid={mapping.name in errors}
      invalidText={errors[mapping.name]?.message as string}
      {...register}
    />
  );
}

export function PasswordInput<MappingType>({
  mapping,
  errors,
  register,
}: BaseInputProps<MappingType>) {
  return (
    //@ts-expect-error missing types - password input is defined in export file but is still not inside its own /component folder */}//
    <CarbonTextInput.PasswordInput
      id={mapping.name}
      labelText={mapping.label}
      invalid={mapping.name in errors}
      invalidText={errors[mapping.name]?.message as string}
      {...register}
    />
  );
}

export function CodeInput<MappingType>({
  mapping,
  errors,
  register,
}: BaseInputProps<MappingType>) {
  return (
    <TextArea
      id={mapping.name}
      labelText={mapping.label}
      helperText={
        <span className="whitespace-pre-line">{mapping.helperText}</span>
      }
      invalid={mapping.name in errors}
      invalidText={errors[mapping.name]?.message as string}
      placeholder={mapping.placeholder}
      {...register}
    />
  );
}

export function SelectFromArray<MappingType>({
  mapping,
  errors,
  register,
}: BaseInputProps<MappingType>) {
  return (
    <Select
      id={mapping.name}
      labelText={mapping.label}
      helperText={mapping.helperText}
      invalid={mapping.name in errors}
      invalidText={errors[mapping.name]?.message as string}
      {...register}
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

interface SelectFromEnumProps<MappingType> extends BaseInputProps<MappingType> {
  mapping: Extract<IngestApiFormMapping<MappingType>, { type: "enum" }>;
}

export function SelectFromEnum<MappingType>({
  mapping,
  errors,
  register,
}: SelectFromEnumProps<MappingType>) {
  return (
    <Select
      id={mapping.name}
      labelText={mapping.label}
      helperText={mapping.helperText}
      invalid={mapping.name in errors}
      invalidText={errors[mapping.name]?.message as string}
      {...register}
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
  errors,
  register,
  onAction,
  actionLabel,
  isActionLoading = false,
}: TextInputWithActionProps<MappingType>) {
  return (
    <div className="flex items-end">
      <TextInput
        id={mapping.name}
        labelText={mapping.label}
        placeholder={mapping.placeholder}
        invalid={mapping.name in errors}
        invalidText={errors[mapping.name]?.message as string}
        {...register}
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
