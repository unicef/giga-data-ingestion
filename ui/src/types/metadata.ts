import { ZodType } from "zod";

export type MetadataFormValues = {
  dataCollectionDate: Date;
  country: string;
  dataCollectionModality: string;
  dataOwner: string;
  dateModified: Date;
  description: string;
  domain: string;
  geolocationDataSource?: string;
  piiClassification: string;
  schoolIdType: string;
  sensitivityLevel: string;
};

export type MetadataFormMapping =
  | {
      name: string;
      label: string;
      helperText: string;
      required: boolean;
      type: "text" | "year" | "month-year";
      validator: ZodType;
    }
  | {
      name: string;
      label: string;
      helperText: string;
      required: boolean;
      type: "enum";
      enum: readonly string[];
      validator: ZodType;
    };
