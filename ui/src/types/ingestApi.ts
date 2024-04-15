export type IngestApiFormMapping<T> =
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "text" | "code" | "number" | "select" | "password";
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[];
      onChange?: (...args: unknown[]) => void;
    }
  | {
      name: Extract<keyof T, string>;
      label: string;
      helperText: string;
      required: boolean;
      type: "text-action";
      action: () => void;
      placeholder?: string;
      dependsOnName?: Extract<keyof T, string>;
      dependsOnValue?: string[];
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
      dependsOnValue?: string[];
      onChange?: () => void;
    };
