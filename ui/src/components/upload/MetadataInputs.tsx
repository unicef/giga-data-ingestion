import {
  FieldError,
  FieldErrors,
  UseFormRegister,
  UseFormRegisterReturn,
} from "react-hook-form";

import { SelectItem, TextInputSkeleton } from "@carbon/react";
import { z } from "zod";

import { Select } from "@/components/forms/Select.tsx";
import { TextInput } from "@/components/forms/TextInput.tsx";
import {
  futureyearList,
  metadataMapping,
  monthList,
} from "@/constants/metadata.ts";
import { MetadataFormMapping } from "@/types/metadata.ts";

export const MetadataForm = z.object({
  ...Object.fromEntries(
    Object.values(metadataMapping)
      .flat()
      .map(item => [item.name, item.validator]),
  ),
});

export type MetadataForm = z.infer<typeof MetadataForm>;

interface CountrySelectProps {
  countryOptions: string[];
  isLoading: boolean;
  register: UseFormRegisterReturn;
  errors: FieldErrors<MetadataForm>;
}

export function CountrySelect({
  countryOptions,
  isLoading,
  register,
  errors,
}: CountrySelectProps) {
  return isLoading ? (
    <TextInputSkeleton />
  ) : (
    <Select
      id="country"
      labelText={
        <>
          Country<sup className="text-giga-red">*</sup>
        </>
      }
      invalid={!!errors.country}
      invalidText={errors["country"]?.message as string}
      {...register}
    >
      <SelectItem value="" text="Select country" />
      {countryOptions.map(country => (
        <SelectItem key={country} text={country} value={country} />
      ))}
    </Select>
  );
}

interface BaseInputProps {
  formItem: MetadataFormMapping;
  errors: FieldErrors;
  register: UseFormRegisterReturn;
  loading?: boolean;
}

export function FreeTextInput({
  formItem,
  errors,
  register,
  loading = false,
}: BaseInputProps) {
  return loading ? (
    <TextInputSkeleton />
  ) : (
    <TextInput
      id={formItem.name}
      labelText={
        <>
          {formItem.label}
          {formItem.required && <sup className="text-giga-red">*</sup>}
        </>
      }
      placeholder={formItem.helperText || undefined}
      invalid={formItem.name in errors}
      invalidText={errors[formItem.name]?.message as string}
      {...register}
    />
  );
}

interface SelectFromEnumProps extends BaseInputProps {
  formItem: Extract<MetadataFormMapping, { type: "enum" }>;
}

export function SelectFromEnum({
  formItem,
  errors,
  register,
}: SelectFromEnumProps) {
  const placeholderText = formItem.helperText || "Select an option";
  return (
    <Select
      id={formItem.name}
      labelText={formItem.label}
      invalid={formItem.name in errors}
      invalidText={errors[formItem.name]?.message as string}
      {...register}
    >
      {formItem.enum.map(el => (
        <SelectItem
          key={el || "placeholder"}
          text={el === "" ? placeholderText : el}
          value={el}
        />
      ))}
    </Select>
  );
}

interface SelectFromArrayProps extends BaseInputProps {
  options: string[];
  subpath?: string;
  labelOverride?: string;
  placeholderOverride?: string;
  hideExtras?: boolean;
}

export function SelectFromArray({
  formItem,
  subpath,
  labelOverride,
  placeholderOverride,
  errors,
  register,
  options,
  hideExtras = false,
}: SelectFromArrayProps) {
  const invalidText = (
    subpath
      ? (errors[formItem.name] as Record<string, FieldError>)?.[subpath]
          ?.message ??
        (errors[formItem.name] as Record<string, FieldError>)?.root?.message
      : errors[formItem.name]?.message
  ) as string;

  const placeholderText =
    placeholderOverride ??
    (hideExtras ? undefined : formItem.helperText || "Select an option");

  return (
    <Select
      id={subpath ? `${formItem.name}.${subpath}` : formItem.name}
      labelText={labelOverride ?? formItem.label}
      invalid={formItem.name in errors}
      invalidText={invalidText}
      {...register}
    >
      {options.map(option => (
        <SelectItem
          key={option || "placeholder"}
          text={option === "" && placeholderText ? placeholderText : option}
          value={option}
        />
      ))}
    </Select>
  );
}

type MonthYearSelectProps = Omit<BaseInputProps, "register"> & {
  register: UseFormRegister<MetadataForm>;
};

export function MonthYearSelect({
  formItem,
  errors,
  register,
}: MonthYearSelectProps) {
  return (
    <div className="flex">
      <SelectFromArray
        options={monthList}
        formItem={formItem}
        subpath="month"
        labelOverride={`${formItem.label} (Month)`}
        placeholderOverride="Select month"
        errors={errors}
        register={register(`${formItem.name}.month`, {
          deps: `${formItem.name}.year`,
          validate: (value, formValues) =>
            (value && formValues[`${formItem.name}.year`]) ||
            (!value && !formValues[`${formItem.name}.year`]),
        })}
      />
      <SelectFromArray
        options={futureyearList}
        formItem={formItem}
        subpath="year"
        labelOverride="Year"
        placeholderOverride="Select year"
        hideExtras
        errors={errors}
        register={register(`${formItem.name}.year`, {
          deps: `${formItem.name}.month`,
          validate: (value, formValues) =>
            (value && formValues[`${formItem.name}.month`]) ||
            (!value && !formValues[`${formItem.name}.month`]),
        })}
      />
    </div>
  );
}
