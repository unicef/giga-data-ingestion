import { format } from "date-fns";
import { z } from "zod";

import { MetadataFormMapping } from "@/types/metadata.ts";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // 1-12
const futureYearStart = currentYear + 10;

const unicefFoundingYear = 1945;

const modalityCollectionOptions = [
  "",
  "Online",
  "Phone",
  "Written",
  "In-person",
  "Others",
  "Unknown",
] as const;

const frequencyCollectionOptions = [
  "",
  "More than once a year",
  "Once a year",
  "Every two years",
  "In more than two years",
] as const;

const schoolIdTypeOptions = [
  "",
  "EMIS",
  "Examination code",
  "Others",
  "Unknown",
] as const;

const yesNoUnknownOptions = ["", "Yes", "No", "Unknown"] as const;

const requiredFieldErrorMessage = "This field is required";

const notInRangeErrorMessage = "Selection is not within the provided range";

/** Section headings used as keys on `metadataMapping` and for school metadata grid layout. */
export const schoolMetadataDatasetSection =
  "Information about the school dataset";
export const schoolMetadataNationalSection =
  "Information about national school data collection practices";

/** Section headings used as keys on `health` and for health metadata grid layout. */
export const healthMetadataDatasetSection =
  "Information about the health dataset";
export const healthMetadataNationalSection =
  "Information about national health data collection practices";

export const metadataMapping: Record<string, MetadataFormMapping[]> = {
  "": [
    {
      name: "country",
      label: "Country",
      helperText: "",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "description",
      label: "Description about the upload",
      helperText: "e.g. change notes, additional context",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
  ],
  [schoolMetadataDatasetSection]: [
    {
      name: "focal_point_name",
      label: "Focal point name",
      helperText: "Name of the person who compiled the data",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "focal_point_contact",
      label: "Focal point email",
      helperText: "Email of the person who compiled the data",
      type: "text",
      required: true,
      validator: z.string().email(),
    },
    {
      name: "data_owner",
      label: "Data owner/s",
      helperText: "e.g. Ministry of Education, Office of Statistics, other",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "year_of_data_collection",
      label: "Year of data collection",
      helperText: "Select year",
      type: "year",
      required: true,
      validator: z.union([
        z.string().max(0),
        z.coerce
          .number()
          .min(unicefFoundingYear, notInRangeErrorMessage)
          .max(currentYear, notInRangeErrorMessage),
      ]),
    },
    {
      name: "modality_of_data_collection",
      label: "Modality of data collection",
      helperText: "Select an option",
      type: "enum",
      enum: modalityCollectionOptions,
      required: false,
      validator: z.enum(modalityCollectionOptions).optional(),
    },
    {
      name: "school_ids_type",
      label: "School ID type",
      helperText: "Select type of school IDs provided",
      type: "enum",
      enum: schoolIdTypeOptions,
      required: false,
      validator: z.enum(schoolIdTypeOptions).optional(),
    },
    {
      name: "data_quality_issues",
      label: "Data gaps / quality issues",
      helperText:
        "Describe here if there are any gaps or issues in the school data, like missing fields, lack of comprehensiveness, or inaccuracies in geolocation",
      type: "text",
      required: false,
      validator: z.string().optional(),
    },
  ],
  [schoolMetadataNationalSection]: [
    {
      name: "frequency_of_school_data_collection",
      label: "Frequency of data collection or update",
      helperText: "Select an option",
      type: "enum",
      enum: frequencyCollectionOptions,
      required: false,
      validator: z.enum(frequencyCollectionOptions).optional(),
    },
    {
      name: "next_school_data_collection",
      label: "Date of the next scheduled data collection",
      helperText: "MM / YYYY",
      type: "text",
      required: false,
      validator: z
        .string()
        .optional()
        .refine(
          val => !val?.trim() || /^(0[1-9]|1[0-2])\/\d{4}$/.test(val.trim()),
          "Use MM/YYYY format (e.g. 01/2025)",
        )
        .refine(val => {
          if (!val?.trim()) return true;
          const match = val.trim().match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
          if (!match) return true; // format already validated above
          const month = parseInt(match[1], 10);
          const year = parseInt(match[2], 10);
          return (
            year > currentYear ||
            (year === currentYear && month >= currentMonth)
          );
        }, "Date must be in the current month or in the future"),
    },
    {
      name: "emis_system",
      label:
        "Is there a functioning Education Management Information Systems (EMIS) in the country?",
      helperText: "Select an option",
      type: "enum",
      enum: yesNoUnknownOptions,
      required: false,
      validator: z.enum(yesNoUnknownOptions).optional(),
    },
    {
      name: "school_contacts",
      label:
        "Does the MoE or Data owner have access to school contact details like phone numbers or emails?",
      helperText: "Select an option",
      type: "enum",
      enum: yesNoUnknownOptions,
      required: false,
      validator: z.enum(yesNoUnknownOptions).optional(),
    },
  ],
};

/** Same field `name`s as school mapping (Zod / API JSON keys); health-specific labels and section titles. */
export const health: Record<string, MetadataFormMapping[]> = {
  "": [
    {
      name: "country",
      label: "Country",
      helperText: "",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "description",
      label: "Health dataset description",
      helperText: "e.g. indicator set, time period, collection purpose",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
  ],
  [healthMetadataDatasetSection]: [
    {
      name: "focal_point_name",
      label: "Person uploading / focal point name",
      helperText: "Name of the person submitting or compiling this dataset",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "focal_point_contact",
      label: "Focal point email",
      helperText: "Email of the person responsible for this upload",
      type: "text",
      required: true,
      validator: z.string().email(),
    },
    {
      name: "data_owner",
      label: "Health data owner/s",
      helperText: "e.g. Ministry of Health, national statistics office, implementing partner",
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "year_of_data_collection",
      label: "Year the data refers to",
      helperText: "Select year",
      type: "year",
      required: true,
      validator: z.union([
        z.string().max(0),
        z.coerce
          .number()
          .min(unicefFoundingYear, notInRangeErrorMessage)
          .max(currentYear, notInRangeErrorMessage),
      ]),
    },
    {
      name: "modality_of_data_collection",
      label: "Modality of health data collection",
      helperText: "Select an option",
      type: "enum",
      enum: modalityCollectionOptions,
      required: false,
      validator: z.enum(modalityCollectionOptions).optional(),
    },
    {
      name: "school_ids_type",
      label: "Primary record / facility ID type",
      helperText: "How records are keyed in this file (if applicable)",
      type: "enum",
      enum: schoolIdTypeOptions,
      required: false,
      validator: z.enum(schoolIdTypeOptions).optional(),
    },
    {
      name: "data_quality_issues",
      label: "Health data gaps / quality issues",
      helperText:
        "Describe missing fields, coverage limits, known biases, or linkage issues",
      type: "text",
      required: false,
      validator: z.string().optional(),
    },
  ],
  [healthMetadataNationalSection]: [
    {
      name: "frequency_of_school_data_collection",
      label: "Frequency of health data collection or update",
      helperText: "Select an option",
      type: "enum",
      enum: frequencyCollectionOptions,
      required: false,
      validator: z.enum(frequencyCollectionOptions).optional(),
    },
    {
      name: "next_school_data_collection",
      label: "Date of the next scheduled health data collection",
      helperText: "MM / YYYY",
      type: "text",
      required: false,
      validator: z
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
        }, "Date must be in the current month or in the future"),
    },
    {
      name: "emis_system",
      label:
        "Is there a functioning national health information system (or equivalent EMR/registry)?",
      helperText: "Select an option",
      type: "enum",
      enum: yesNoUnknownOptions,
      required: false,
      validator: z.enum(yesNoUnknownOptions).optional(),
    },
    {
      name: "school_contacts",
      label:
        "Does the data owner have access to facility or respondent contact details (e.g. phone, email)?",
      helperText: "Select an option",
      type: "enum",
      enum: yesNoUnknownOptions,
      required: false,
      validator: z.enum(yesNoUnknownOptions).optional(),
    },
  ],
};

export const yearList = [
  "",
  ...Array(currentYear - unicefFoundingYear + 1)
    .fill(currentYear)
    .map((el, i) => `${el - i}`),
];

export const futureyearList = [
  "",
  ...Array(futureYearStart - currentYear + 1)
    .fill(futureYearStart)
    .map((el, i) => `${el - i}`),
];

export const monthList = [
  "",
  ...Array(12)
    .fill(0)
    .map((_, i) => format(`${currentYear}-${i + 1}-01`, "MMMM")),
];
