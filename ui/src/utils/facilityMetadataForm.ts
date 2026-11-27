import { ZodType, z } from "zod";

import { MetadataFormMapping } from "@/types/metadata.ts";

const requiredFieldErrorMessage = "This field is required";
const notInRangeErrorMessage = "Selection is not within the provided range";

export type FacilityMetadataFieldConfig = {
  name: string;
  label: string;
  helper_text?: string;
  type: "text" | "email" | "year" | "enum" | "month_year";
  required?: boolean;
  options?: string[] | null;
  min_year?: number | null;
};

export type FacilityMetadataSectionConfig = {
  title?: string;
  fields: FacilityMetadataFieldConfig[];
};

export type FacilityMetadataFormConfig = {
  heading?: string;
  intro?: string[];
  sections: FacilityMetadataSectionConfig[];
};

function buildValidator(field: FacilityMetadataFieldConfig): ZodType {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const minYear = field.min_year ?? 1945;
  const required = field.required ?? false;

  switch (field.type) {
    case "email": {
      const base = z.string().email();
      return required ? base : z.union([z.literal(""), base]);
    }
    case "year": {
      const yearNumber = z.coerce
        .number()
        .min(minYear, notInRangeErrorMessage)
        .max(currentYear, notInRangeErrorMessage);
      return required
        ? z.union([z.string().max(0), yearNumber])
        : z.union([z.literal(""), yearNumber]).optional();
    }
    case "enum": {
      const options = ["", ...(field.options ?? [])] as [string, ...string[]];
      const enumSchema = z.enum(options);
      return required ? enumSchema : enumSchema.optional();
    }
    case "month_year": {
      const schema = z
        .string()
        .optional()
        .refine(
          val => !val?.trim() || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val.trim()),
          "Use MM/YYYY format (e.g. 01/2025)",
        )
        .refine(val => {
          if (!val?.trim()) return true;
          const match = val.trim().match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
          if (!match) return true;
          const month = parseInt(match[1], 10);
          const year = parseInt(match[2], 10);
          return (
            year > currentYear ||
            (year === currentYear && month >= currentMonth)
          );
        }, "Date must be in the current month or in the future");
      return required
        ? z.string().min(1, { message: requiredFieldErrorMessage }).and(schema)
        : schema;
    }
    case "text":
    default: {
      return required
        ? z.string().min(1, { message: requiredFieldErrorMessage })
        : z.string().optional();
    }
  }
}

function toFormMapping(
  field: FacilityMetadataFieldConfig,
): MetadataFormMapping {
  const helperText = field.helper_text ?? "";
  const required = field.required ?? false;
  const validator = buildValidator(field);

  if (field.type === "enum") {
    return {
      name: field.name,
      label: field.label,
      helperText,
      required,
      type: "enum",
      enum: ["", ...(field.options ?? [])],
      validator,
    };
  }

  // month_year uses text input with MM/YYYY helper (same as legacy school form).
  if (field.type === "year") {
    return {
      name: field.name,
      label: field.label,
      helperText,
      required,
      type: "year",
      validator,
    };
  }

  return {
    name: field.name,
    label: field.label,
    helperText,
    required,
    type: "text",
    validator,
  };
}

/** Convert profile metadata YAML into the Record used by the metadata form UI. */
export function metadataConfigToMapping(
  config: FacilityMetadataFormConfig,
): Record<string, MetadataFormMapping[]> {
  const mapping: Record<string, MetadataFormMapping[]> = {};
  for (const section of config.sections) {
    const title = section.title ?? "";
    mapping[title] = section.fields.map(toFormMapping);
  }
  return mapping;
}

export function metadataConfigToZodSchema(config: FacilityMetadataFormConfig) {
  const entries = config.sections
    .flatMap(section => section.fields)
    .map(field => [field.name, buildValidator(field)] as const);
  return z.object(Object.fromEntries(entries));
}
