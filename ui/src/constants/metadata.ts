import { format } from "date-fns";
import { z } from "zod";

import { MetadataFormMapping } from "@/types/metadata.ts";

const thisYear = new Date().getFullYear();

const unicefFoundingYear = 1945;

const modalityCollectionOptions = [
  "online",
  "phone",
  "written",
  "in-person",
  "others",
  "unknown",
] as const;

const frequencyCollectionOptions = [
  "more than once a year",
  "once a year",
  "every two years",
  "in more than two years",
] as const;

const schoolIdTypeOptions = [
  "EMIS",
  "examination code",
  "others",
  "unknown",
] as const;

const yesNoUnknownOptions = ["yes", "no", "unknown"] as const;

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
  ],
  "Background information on the school dataset": [
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
      label: "Focal point contact",
      helperText: "Email of the person who compiled the data",
      type: "text",
      required: true,
      validator: z.string().email(),
    },
    {
      name: "data_owner",
      label: "Data owner(s)",
      helperText: `Who is the entity owning and sharing this dataset?
      e.g. Ministry of Education, Office of Statistics, other
      `,
      type: "text",
      required: true,
      validator: z.string().min(1, { message: requiredFieldErrorMessage }),
    },
    {
      name: "year_of_data_collection",
      label: "Year of data collection",
      helperText: "When was the data collected (month/year)?",
      type: "year",
      required: true,
      validator: z.coerce
        .number()
        .min(unicefFoundingYear, notInRangeErrorMessage)
        .max(thisYear, notInRangeErrorMessage),
    },
    {
      name: "modality_of_data_collection",
      label: "Modality of data collection",
      helperText:
        "How was the data collected (online, phone, written, in-person)?",
      type: "enum",
      enum: modalityCollectionOptions,
      required: false,
      validator: z.enum(modalityCollectionOptions).nullable(),
    },
    {
      name: "school_ids_type",
      label: "School IDs type",
      helperText:
        "What type of school IDs are provided in the dataset (e.g. EMIS IDs, examination codes, other)? Are they official school IDs?",
      type: "enum",
      enum: schoolIdTypeOptions,
      required: false,
      validator: z.enum(schoolIdTypeOptions).nullable(),
    },
    {
      name: "data_quality_issues",
      label: "Data gaps / quality issues",
      helperText: `Are there any known gaps or issues in the school data that you are aware of?
      For example:
      Is the dataset exhaustive of all primary and secondary schools in the country? 
      Are any mandatory data fields missing from the dataset? 
      Is there uncertainty regarding the accuracy of school geolocation coordinates?
      `,
      type: "text",
      required: false,
      validator: z.string().nullable(),
    },
  ],
  "Background information on school data collection practices in the country": [
    {
      name: "frequency_of_school_data_collection",
      label: "Frequency of school data collection",
      helperText: "How often is school data collected/updated?",
      type: "enum",
      enum: frequencyCollectionOptions,
      required: false,
      validator: z.enum(frequencyCollectionOptions).nullable(),
    },
    {
      name: "next_school_data_collection",
      label: "Next school data collection",
      helperText: "When is the next school data collection planned for?",
      type: "month-year",
      required: false,
      validator: z
        .object({
          month: z.string().min(1),
          year: z.coerce
            .number()
            .min(unicefFoundingYear, notInRangeErrorMessage)
            .max(thisYear, notInRangeErrorMessage),
        })
        .nullable()
        .refine(
          data =>
            [data?.year, data?.month].every(Boolean) ||
            [data?.year, data?.month].every(el => !el),
          { message: "Both month and year must be provided" },
        ),
    },
    {
      name: "emis_system",
      label: "EMIS system",
      helperText:
        "Is there a functioning Education Management Information Systems (EMIS) in the country?",
      type: "enum",
      enum: yesNoUnknownOptions,
      required: false,
      validator: z.enum(yesNoUnknownOptions).nullable(),
    },
    {
      name: "school_contacts",
      label: "School contacts",
      helperText:
        "Does the Ministry of Education / data owner have access to school contacts such as a telephone number or an email?",
      type: "enum",
      enum: yesNoUnknownOptions,
      required: false,
      validator: z.enum(yesNoUnknownOptions).nullable(),
    },
  ],
};

export const yearList = Array(thisYear - unicefFoundingYear + 1)
  .fill(thisYear)
  .map((el, i) => `${el - i}`);

export const monthList = Array(12)
  .fill(0)
  .map((_, i) => format(`${thisYear}-${i + 1}-01`, "MMMM"));
