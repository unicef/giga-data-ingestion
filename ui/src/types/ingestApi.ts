import { SyntheticEvent } from "react";

import { GraphUser } from "@/types/user.ts";

export type IngestApiFormMapping<T> = {
  name: Extract<keyof T, string>;
  label: string;
  helperText: string;
  required: boolean;
  placeholder?: string;
  onChange?: (e?: SyntheticEvent) => void;
  dependsOnName?: Extract<keyof T, string>;
  dependsOnValue?: string[] | true;
  customValidation?:
    | ((value: T[keyof T]) => boolean | string)
    | Record<string, (value: T[keyof T]) => boolean | string>;
} & (
  | {
      type: "text" | "code" | "number" | "password" | "toggle";
    }
  | {
      type: "select";
      options: string[];
    }
  | {
      type: "select-object";
      options: Record<string, string>[];
      valueAccessor: string;
      labelAccessor: string;
    }
  | {
      type: "select-user";
      options: GraphUser[];
    }
  | {
      type: "text-action";
      action: () => void;
      isActionLoading: boolean;
    }
  | {
      type: "enum";
      enum: readonly string[];
      onChange?: () => void;
    }
);
