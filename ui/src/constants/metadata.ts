import { format } from "date-fns";
import { z } from "zod";

import { MetadataFormMapping } from "@/types/metadata.ts";

const currentYear = new Date().getFullYear();
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
  "Information about the school dataset": [
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
  "Information about national school data collection practices": [
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
      type: "month-year",
      required: false,
      validator: z
        .object({
          month: z.string(),
          year: z.union([
            z.string().max(0),
            z.coerce
              .number()
              .min(currentYear, notInRangeErrorMessage)
              .max(futureYearStart, notInRangeErrorMessage),
          ]),
        })
        .optional()
        .refine(
          data =>
            [data?.year, data?.month].every(Boolean) ||
            [data?.year, data?.month].every(el => !el),
          "Both month and year must be provided",
        ),
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
