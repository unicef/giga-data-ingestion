import { GraphUser } from "@/types/user.ts";

export type IngestApiFormMapping<T> =
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "text" | "code" | "number" | "password" | "toggle";
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[] | true;
      onChange?: (...args: unknown[]) => void;
    }
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "select";
      options: string[];
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[] | true;
      onChange?: (...args: unknown[]) => void;
    }
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "select-user";
      options: GraphUser[];
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[] | true;
      onChange?: (...args: unknown[]) => void;
    }
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "text-action";
      action: () => void;
      isActionLoading: boolean;
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[] | true;
      onChange?: (...args: unknown[]) => void;
    }
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "enum";
      enum: readonly string[];
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[] | true;
      onChange?: () => void;
    };
